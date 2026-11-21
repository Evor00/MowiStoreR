package com.mowistore.intelligencepayments;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "mowistore")
public class MowiStoreProperties {
    private String coreApiUrl = "http://localhost:8000";
    private String coreServiceToken = "";
    private String stripeSecretKey = "";
    private String stripeWebhookSecret = "";
    private String geminiApiKey = "";
    private String geminiModel = "gemini-2.0-flash";
    private String currency = "pen";

    public String getCoreApiUrl() { return coreApiUrl; }
    public void setCoreApiUrl(String coreApiUrl) { this.coreApiUrl = coreApiUrl; }
    public String getCoreServiceToken() { return coreServiceToken; }
    public void setCoreServiceToken(String coreServiceToken) { this.coreServiceToken = coreServiceToken; }
    public String getStripeSecretKey() { return stripeSecretKey; }
    public void setStripeSecretKey(String stripeSecretKey) { this.stripeSecretKey = stripeSecretKey; }
    public String getStripeWebhookSecret() { return stripeWebhookSecret; }
    public void setStripeWebhookSecret(String stripeWebhookSecret) { this.stripeWebhookSecret = stripeWebhookSecret; }
    public String getGeminiApiKey() { return geminiApiKey; }
    public void setGeminiApiKey(String geminiApiKey) { this.geminiApiKey = geminiApiKey; }
    public String getGeminiModel() { return geminiModel; }
    public void setGeminiModel(String geminiModel) { this.geminiModel = geminiModel; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
}
