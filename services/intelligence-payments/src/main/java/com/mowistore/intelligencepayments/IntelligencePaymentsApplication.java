package com.mowistore.intelligencepayments;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(MowiStoreProperties.class)
public class IntelligencePaymentsApplication {
    public static void main(String[] args) {
        SpringApplication.run(IntelligencePaymentsApplication.class, args);
    }
}
