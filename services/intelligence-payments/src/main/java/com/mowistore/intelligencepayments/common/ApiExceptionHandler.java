package com.mowistore.intelligencepayments.common;

import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.RestClientResponseException;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<Map<String, String>> validation(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream().findFirst().map(error -> error.getField() + ": " + error.getDefaultMessage()).orElse("Solicitud inválida.");
        return ResponseEntity.badRequest().body(Map.of("detail", message));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<Map<String, String>> badRequest(IllegalArgumentException exception) {
        return ResponseEntity.badRequest().body(Map.of("detail", exception.getMessage()));
    }

    @ExceptionHandler(SignatureVerificationException.class)
    ResponseEntity<Map<String, String>> invalidSignature(SignatureVerificationException exception) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("detail", "Firma de webhook inválida."));
    }

    @ExceptionHandler({StripeException.class, RestClientResponseException.class})
    ResponseEntity<Map<String, String>> dependencyFailure(Exception exception) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("detail", "No se pudo completar la solicitud con un servicio externo."));
    }

    @ExceptionHandler(IllegalStateException.class)
    ResponseEntity<Map<String, String>> unavailable(IllegalStateException exception) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("detail", exception.getMessage()));
    }
}
