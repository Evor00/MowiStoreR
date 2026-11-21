package com.mowistore.intelligencepayments.payments;

import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {
    private final StripePaymentService service;

    public PaymentController(StripePaymentService service) {
        this.service = service;
    }

    @PostMapping("/payment-intents")
    public ResponseEntity<PaymentIntentResponse> createPaymentIntent(@Valid @RequestBody PaymentIntentRequest request,
                                                                       @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) throws StripeException {
        return ResponseEntity.ok(service.createPaymentIntent(request, authorization));
    }

    @PostMapping("/webhooks/stripe")
    public ResponseEntity<Map<String, Boolean>> stripeWebhook(@RequestBody String payload,
                                                               @RequestHeader("Stripe-Signature") String signature) throws SignatureVerificationException {
        service.processWebhook(payload, signature);
        return ResponseEntity.ok(Map.of("received", true));
    }
}
