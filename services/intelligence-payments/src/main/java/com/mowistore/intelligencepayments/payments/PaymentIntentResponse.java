package com.mowistore.intelligencepayments.payments;

public record PaymentIntentResponse(String paymentIntentId, String clientSecret, String currency, long amount) { }
