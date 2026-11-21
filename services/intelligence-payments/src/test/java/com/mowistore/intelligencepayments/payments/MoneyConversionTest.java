package com.mowistore.intelligencepayments.payments;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class MoneyConversionTest {
    @Test
    void paymentIntentResponsePreservesMinorUnitAmount() {
        PaymentIntentResponse response = new PaymentIntentResponse("pi_test", "secret", "pen", new BigDecimal("25.50").movePointRight(2).longValueExact());
        assertEquals(2550L, response.amount());
    }
}
