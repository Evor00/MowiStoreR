package com.mowistore.intelligencepayments.payments;

import com.mowistore.intelligencepayments.MowiStoreProperties;
import com.mowistore.intelligencepayments.core.CoreCommerceClient;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.PaymentIntent;
import com.stripe.model.StripeObject;
import com.stripe.net.RequestOptions;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;
import java.math.BigDecimal;
import java.math.RoundingMode;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class StripePaymentService {
    private final MowiStoreProperties properties;
    private final CoreCommerceClient coreClient;

    public StripePaymentService(MowiStoreProperties properties, CoreCommerceClient coreClient) {
        this.properties = properties;
        this.coreClient = coreClient;
    }

    public PaymentIntentResponse createPaymentIntent(PaymentIntentRequest request, String authorization) throws StripeException {
        requireStripeConfiguration();
        CoreCommerceClient.CoreOrder order = coreClient.getOrder(request.orderReference(), authorization);
        if (!"pending".equals(order.paymentStatus())) {
            throw new IllegalArgumentException("Este pedido ya no admite un nuevo intento de pago.");
        }
        long amount = toMinorUnits(order.total());
        Stripe.apiKey = properties.getStripeSecretKey();
        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
            .setAmount(amount)
            .setCurrency(properties.getCurrency())
            .setAutomaticPaymentMethods(PaymentIntentCreateParams.AutomaticPaymentMethods.builder().setEnabled(true).build())
            .putMetadata("order_reference", order.reference())
            .build();
        RequestOptions options = RequestOptions.builder()
            .setIdempotencyKey("mowistore-payment-intent-" + order.reference())
            .build();
        PaymentIntent intent = PaymentIntent.create(params, options);
        coreClient.updatePayment(order.reference(), intent.getId(), "pending", "pending_payment");
        return new PaymentIntentResponse(intent.getId(), intent.getClientSecret(), properties.getCurrency(), amount);
    }

    public void processWebhook(String payload, String signature) throws SignatureVerificationException {
        requireStripeConfiguration();
        if (!StringUtils.hasText(properties.getStripeWebhookSecret())) {
            throw new IllegalStateException("STRIPE_WEBHOOK_SECRET no está configurado.");
        }
        Event event = Webhook.constructEvent(payload, signature, properties.getStripeWebhookSecret());
        if (!event.getType().startsWith("payment_intent.")) return;
        EventDataObjectDeserializer data = event.getDataObjectDeserializer();
        StripeObject object = data.getObject().orElse(null);
        if (!(object instanceof PaymentIntent intent)) return;
        String reference = intent.getMetadata().get("order_reference");
        if (!StringUtils.hasText(reference)) return;
        switch (event.getType()) {
            case "payment_intent.succeeded" -> coreClient.updatePayment(reference, intent.getId(), "succeeded", "paid");
            case "payment_intent.payment_failed" -> coreClient.updatePayment(reference, intent.getId(), "failed", "pending_payment");
            case "payment_intent.canceled" -> coreClient.updatePayment(reference, intent.getId(), "failed", "cancelled");
            default -> { }
        }
    }

    private void requireStripeConfiguration() {
        if (!StringUtils.hasText(properties.getStripeSecretKey())) {
            throw new IllegalStateException("STRIPE_SECRET_KEY no está configurado.");
        }
    }

    private long toMinorUnits(BigDecimal amount) {
        if (amount == null || amount.signum() <= 0) throw new IllegalArgumentException("El total del pedido debe ser mayor a cero.");
        return amount.movePointRight(2).setScale(0, RoundingMode.HALF_UP).longValueExact();
    }
}
