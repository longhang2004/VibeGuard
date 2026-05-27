package com.vibeguard.securityscanner.dto;

import java.util.HashMap;
import java.util.Map;

public class ApiResponse<T> {
    private boolean success;
    private T data;
    private ApiError error;
    private Map<String, Object> meta;

    public ApiResponse() {
        this.meta = new HashMap<>();
    }

    public ApiResponse(boolean success, T data, ApiError error, Map<String, Object> meta) {
        this.success = success;
        this.data = data;
        this.error = error;
        this.meta = meta != null ? meta : new HashMap<>();
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data, null, new HashMap<>());
    }

    public static <T> ApiResponse<T> success(T data, Map<String, Object> meta) {
        return new ApiResponse<>(true, data, null, meta);
    }

    public static <T> ApiResponse<T> error(String code, String message) {
        return new ApiResponse<>(false, null, new ApiError(code, message), new HashMap<>());
    }

    // Getters and Setters
    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }

    public ApiError getError() {
        return error;
    }

    public void setError(ApiError error) {
        this.error = error;
    }

    public Map<String, Object> getMeta() {
        return meta;
    }

    public void setMeta(Map<String, Object> meta) {
        this.meta = meta;
    }

    public static class ApiError {
        private String code;
        private String message;

        public ApiError() {}

        public ApiError(String code, String message) {
            this.code = code;
            this.message = message;
        }

        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }
}
