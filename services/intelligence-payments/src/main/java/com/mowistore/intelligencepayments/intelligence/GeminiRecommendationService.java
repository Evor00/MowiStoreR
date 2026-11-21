package com.mowistore.intelligencepayments.intelligence;

import com.fasterxml.jackson.databind.JsonNode;
import com.mowistore.intelligencepayments.MowiStoreProperties;
import com.mowistore.intelligencepayments.core.CoreCommerceClient;
import java.util.List;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

@Service
public class GeminiRecommendationService {
    private final MowiStoreProperties properties;
    private final CoreCommerceClient coreClient;
    private final RestClient geminiClient;

    public GeminiRecommendationService(MowiStoreProperties properties, CoreCommerceClient coreClient) {
        this.properties = properties;
        this.coreClient = coreClient;
        this.geminiClient = RestClient.builder().baseUrl("https://generativelanguage.googleapis.com").build();
    }

    public RecommendationResponse recommend(RecommendationRequest request) {
        if (!StringUtils.hasText(properties.getGeminiApiKey())) {
            throw new IllegalStateException("GEMINI_API_KEY no está configurado.");
        }
        List<CoreCommerceClient.ProductContext> products = coreClient.findProducts(request.query());
        if (products.isEmpty()) {
            return new RecommendationResponse("No encontré productos disponibles que coincidan con tu búsqueda.", List.of());
        }
        String prompt = buildPrompt(request.query(), products);
        Map<String, Object> body = Map.of(
            "contents", List.of(Map.of("role", "user", "parts", List.of(Map.of("text", prompt)))),
            "generationConfig", Map.of("temperature", 0.2, "maxOutputTokens", 250)
        );
        JsonNode response = geminiClient.post()
            .uri("/v1beta/models/{model}:generateContent", properties.getGeminiModel())
            .header("x-goog-api-key", properties.getGeminiApiKey())
            .contentType(MediaType.APPLICATION_JSON)
            .body(body)
            .retrieve()
            .body(JsonNode.class);
        String answer = response == null ? "" : response.path("candidates").path(0).path("content").path("parts").path(0).path("text").asText();
        if (!StringUtils.hasText(answer)) answer = "Te mostramos los productos más cercanos a tu búsqueda.";
        List<RecommendationResponse.ProductRecommendation> results = products.stream()
            .map(product -> new RecommendationResponse.ProductRecommendation(product.name(), product.price(), product.category()))
            .toList();
        return new RecommendationResponse(answer, results);
    }

    private String buildPrompt(String query, List<CoreCommerceClient.ProductContext> products) {
        String catalog = products.stream()
            .map(product -> "- " + product.name() + " | S/ " + product.price() + " | " + product.category() + " | " + product.description())
            .reduce("", (left, right) -> left + "\n" + right);
        return "Eres el asistente de MowiStore. Responde en español, en máximo 90 palabras y recomienda solo productos de este catálogo. "
            + "No inventes disponibilidad, precio ni características. Consulta: " + query + ". Catálogo:" + catalog;
    }
}
