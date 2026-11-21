package com.mowistore.intelligencepayments.intelligence;

import java.util.List;

public record RecommendationResponse(String answer, List<ProductRecommendation> products) {
    public record ProductRecommendation(String name, String price, String category) { }
}
