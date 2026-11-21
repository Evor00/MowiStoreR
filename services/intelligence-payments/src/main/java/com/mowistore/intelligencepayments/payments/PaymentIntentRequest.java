package com.mowistore.intelligencepayments.payments;

import jakarta.validation.constraints.NotBlank;

public record PaymentIntentRequest(@NotBlank String orderReference) { }
