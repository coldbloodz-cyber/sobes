package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/mux"
	_ "github.com/mattn/go-sqlite3"
)

// User представляет структуру пользователя
type User struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Age       int       `json:"age"`
	CreatedAt time.Time `json:"created_at"`
}

// UserRequest для входящих запросов (без ID и CreatedAt)
type UserRequest struct {
	Name  string `json:"name"`
	Email string `json:"email"`
	Age   int    `json:"age"`
}

// ErrorResponse для возврата ошибок
type ErrorResponse struct {
	Error   string   `json:"error"`
	Details []string `json:"details,omitempty"`
}

// SuccessResponse для успешных ответов
type SuccessResponse struct {
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

var db *sql.DB

func main() {
	// Инициализация базы данных
	var err error
	db, err = sql.Open("sqlite3", "./users.db")
	if err != nil {
		log.Fatal("Failed to open database:", err)
	}
	defer db.Close()

	// Создание таблицы пользователей
	err = createTable()
	if err != nil {
		log.Fatal("Failed to create table:", err)
	}

	// Настройка маршрутов
	router := mux.NewRouter()

	// Эндпоинты API
	router.HandleFunc("/health", healthHandler).Methods("GET")
	router.HandleFunc("/users", getUsersHandler).Methods("GET")
	router.HandleFunc("/users", createUserHandler).Methods("POST")
	router.HandleFunc("/users/{id}", updateUserHandler).Methods("PUT")
	router.HandleFunc("/users/{id}", deleteUserHandler).Methods("DELETE")

	// Middleware для CORS
	router.Use(corsMiddleware)

	// Middleware для логирования
	router.Use(loggingMiddleware)

	fmt.Println("🚀 User API Server starting on :8080")
	fmt.Println("📍 Endpoints:")
	fmt.Println("   GET  /health        - Health check")
	fmt.Println("   GET  /users         - Get all users")
	fmt.Println("   POST /users         - Create user")
	fmt.Println("   PUT  /users/{id}    - Update user")
	fmt.Println("   DELETE /users/{id}  - Delete user")

	log.Fatal(http.ListenAndServe(":8080", router))
}

// createTable создает таблицу пользователей если её нет
func createTable() error {
	query := `
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		email TEXT NOT NULL UNIQUE,
		age INTEGER NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);`

	_, err := db.Exec(query)
	return err
}

// validateUser валидирует данные пользователя
func validateUser(user UserRequest) []string {
	var errors []string

	// Валидация имени
	if strings.TrimSpace(user.Name) == "" {
		errors = append(errors, "Name is required")
	}
	if len(user.Name) > 100 {
		errors = append(errors, "Name must be less than 100 characters")
	}

	// Валидация email
	if strings.TrimSpace(user.Email) == "" {
		errors = append(errors, "Email is required")
	}
	if !isValidEmail(user.Email) {
		errors = append(errors, "Invalid email format")
	}

	// Валидация возраста
	if user.Age < 0 {
		errors = append(errors, "Age must be non-negative")
	}
	if user.Age > 150 {
		errors = append(errors, "Age must be less than 150")
	}

	return errors
}

// isValidEmail простая проверка email
func isValidEmail(email string) bool {
	return strings.Contains(email, "@") && strings.Contains(email, ".")
}

// healthHandler - проверка состояния сервера
func healthHandler(w http.ResponseWriter, r *http.Request) {
	response := map[string]interface{}{
		"status":    "OK",
		"timestamp": time.Now().Format(time.RFC3339),
		"service":   "User API",
		"version":   "1.0.0",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// getUsersHandler - получение всех пользователей
func getUsersHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, name, email, age, created_at FROM users ORDER BY created_at DESC")
	if err != nil {
		http.Error(w, `{"error": "Failed to fetch users"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var user User
		err := rows.Scan(&user.ID, &user.Name, &user.Email, &user.Age, &user.CreatedAt)
		if err != nil {
			http.Error(w, `{"error": "Failed to scan user"}`, http.StatusInternalServerError)
			return
		}
		users = append(users, user)
	}

	// Проверка на ошибки после завершения итерации
	if err = rows.Err(); err != nil {
		http.Error(w, `{"error": "Database query error"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"users": users,
		"count": len(users),
	})
}

// createUserHandler - создание нового пользователя
func createUserHandler(w http.ResponseWriter, r *http.Request) {
	var userReq UserRequest

	// Декодирование JSON
	if err := json.NewDecoder(r.Body).Decode(&userReq); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{
			Error: "Invalid JSON format",
		})
		return
	}

	// Валидация
	if errors := validateUser(userReq); len(errors) > 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{
			Error:   "Validation failed",
			Details: errors,
		})
		return
	}

	// Вставка в базу данных
	result, err := db.Exec(
		"INSERT INTO users (name, email, age) VALUES (?, ?, ?)",
		userReq.Name, userReq.Email, userReq.Age,
	)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusConflict)
			json.NewEncoder(w).Encode(ErrorResponse{
				Error: "Email already exists",
			})
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{
			Error: "Failed to create user",
		})
		return
	}

	// Получение ID созданного пользователя
	userID, err := result.LastInsertId()
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{
			Error: "Failed to get user ID",
		})
		return
	}

	// Получение созданного пользователя
	var createdUser User
	err = db.QueryRow(
		"SELECT id, name, email, age, created_at FROM users WHERE id = ?",
		userID,
	).Scan(&createdUser.ID, &createdUser.Name, &createdUser.Email, &createdUser.Age, &createdUser.CreatedAt)

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{
			Error: "Failed to fetch created user",
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(createdUser)
}

// updateUserHandler - обновление пользователя
func updateUserHandler(w http.ResponseWriter, r *http.Request) {
	// Получение ID из URL
	vars := mux.Vars(r)
	userID, err := strconv.Atoi(vars["id"])
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{
			Error: "Invalid user ID",
		})
		return
	}

	var userReq UserRequest

	// Декодирование JSON
	if err := json.NewDecoder(r.Body).Decode(&userReq); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{
			Error: "Invalid JSON format",
		})
		return
	}

	// Валидация
	if errors := validateUser(userReq); len(errors) > 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{
			Error:   "Validation failed",
			Details: errors,
		})
		return
	}

	// Обновление пользователя
	result, err := db.Exec(
		"UPDATE users SET name = ?, email = ?, age = ? WHERE id = ?",
		userReq.Name, userReq.Email, userReq.Age, userID,
	)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusConflict)
			json.NewEncoder(w).Encode(ErrorResponse{
				Error: "Email already exists",
			})
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{
			Error: "Failed to update user",
		})
		return
	}

	// Проверка, что пользователь существует
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{
			Error: "Failed to check update result",
		})
		return
	}

	if rowsAffected == 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(ErrorResponse{
			Error: "User not found",
		})
		return
	}

	// Получение обновленного пользователя
	var updatedUser User
	err = db.QueryRow(
		"SELECT id, name, email, age, created_at FROM users WHERE id = ?",
		userID,
	).Scan(&updatedUser.ID, &updatedUser.Name, &updatedUser.Email, &updatedUser.Age, &updatedUser.CreatedAt)

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{
			Error: "Failed to fetch updated user",
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updatedUser)
}

// deleteUserHandler - удаление пользователя
func deleteUserHandler(w http.ResponseWriter, r *http.Request) {
	// Получение ID из URL
	vars := mux.Vars(r)
	userID, err := strconv.Atoi(vars["id"])
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{
			Error: "Invalid user ID",
		})
		return
	}

	// Удаление пользователя
	result, err := db.Exec("DELETE FROM users WHERE id = ?", userID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{
			Error: "Failed to delete user",
		})
		return
	}

	// Проверка, что пользователь существовал
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{
			Error: "Failed to check delete result",
		})
		return
	}

	if rowsAffected == 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(ErrorResponse{
			Error: "User not found",
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(SuccessResponse{
		Message: "User deleted successfully",
	})
}

// corsMiddleware добавляет CORS заголовки
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Обработка preflight OPTIONS запросов
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// loggingMiddleware логирует HTTP запросы
func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Выполнение запроса
		next.ServeHTTP(w, r)

		// Логирование
		log.Printf(
			"%s %s %s %v",
			r.Method,
			r.RequestURI,
			r.RemoteAddr,
			time.Since(start),
		)
	})
}
