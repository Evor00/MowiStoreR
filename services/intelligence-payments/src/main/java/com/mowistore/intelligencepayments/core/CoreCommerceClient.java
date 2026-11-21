package com.mowistore.intelligencepayments.core;

import com.fasterxml.jackson.databind.JsonNode;
import com.mowistore.intelligencepayments.MowiStoreProperties;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

@Component
public class CoreCommerceClient {
    private final MowiStoreProperties properties;
    private final RestClient client;

    public CoreCommerceClient(MowiStoreProperties properties) {
        this.properties = properties;
        this.client = RestClient.builder().baseUrl(properties.getCoreApiUrl()).build();
    }

    public CoreOrder getOrder(String reference, String authorization) {
        if (!StringUtils.hasText(authorization)) {
            throw new IllegalArgumentException("Debes iniciar sesión para pagar un pedido.");
        }
        JsonNode response = client.get()
            .uri("/api/v1/orders/{reference}/", reference)
            .header(HttpHeaders.AUTHORIZATION, authorization)
            .retrieve()
            .body(JsonNode.class);
        if (response == null || !response.hasNonNull("total")) {
            throw new IllegalStateException("El Core API devolvió un pedido inválido.");
        }
        return new CoreOrder(response.path("reference").asText(), response.path("total").decimalValue(), response.path("payment_status").asText());
    }

    public List<ProductContext> findProducts(String query) {
        JsonNode response = client.get()
            .uri(uriBuilder -> uriBuilder.path("/api/v1/products/").queryParam("search", query).queryParam("page_size", 6).build())
            .retrieve()
            .body(JsonNode.class);
        if (response == null || !response.has("results")) return List.of();
        List<ProductContext> products = new ArrayList<>();
        response.path("results").forEach(product -> products.add(new ProductContext(
                product.path("name").asText(),
                product.path("description").asText(),
                product.path("price").asText(),
                product.path("category").path("name").asText())));
        return products;
    }

    public void updatePayment(String reference, String providerId, String paymentStatus, String orderStatus) {
        if (!StringUtils.hasText(properties.getCoreServiceToken())) {
            throw new IllegalStateException("CORE_SERVICE_TOKEN no está configurado.");
        }
        client.patch()
            .uri("/api/v1/internal/orders/{reference}/payment/", reference)
            .header("X-Service-Token", properties.getCoreServiceToken())
            .contentType(MediaType.APPLICATION_JSON)
            .body(Map.of("provider_id", providerId, "payment_status", paymentStatus, "order_status", orderStatus))
            .retrieve()
            .toBodilessEntity();
    }

    public record CoreOrder(String reference, BigDecimal total, String paymentStatus) { }
    public record ProductContext(String name, String description, String price, String category) { }
}
