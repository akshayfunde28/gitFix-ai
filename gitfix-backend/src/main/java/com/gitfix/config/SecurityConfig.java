package com.gitfix.config;

import com.gitfix.common.CryptoUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SecurityConfig {

    @Bean
    public CryptoUtils cryptoUtils(AppProperties appProperties) {
        return new CryptoUtils(appProperties.getEncryptionKey());
    }
}
