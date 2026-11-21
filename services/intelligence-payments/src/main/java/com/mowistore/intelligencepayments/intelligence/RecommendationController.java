package com.mowistore.intelligencepayments.intelligence;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ai")
public class RecommendationController {
    private final GeminiRecommendationService service;

    public RecommendationController(GeminiRecommendationService service) {
        this.service = service;
    }

    @PostMapping("/recommendations")
    public ResponseEntity<RecommendationResponse> recommend(@Valid @RequestBody RecommendationRequest request) {
        return ResponseEntity.ok(service.recommend(request));
    }
}
