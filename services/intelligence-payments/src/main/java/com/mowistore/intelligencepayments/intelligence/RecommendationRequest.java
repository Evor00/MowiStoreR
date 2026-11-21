package com.mowistore.intelligencepayments.intelligence;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RecommendationRequest(@NotBlank @Size(max = 250) String query) { }
