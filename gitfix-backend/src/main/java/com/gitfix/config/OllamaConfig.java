package com.gitfix.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.ollama.api.OllamaApi;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Custom Ollama configuration that replaces the default OllamaApi bean
 * with a 10-minute read timeout instead of Spring AI's default ~60s.
 * This prevents "Read timed out" errors when qwen2.5-coder:7b takes
 * a long time to generate patches for large code-analysis prompts.
 */
@Configuration
public class OllamaConfig {

    private static final Logger log = LoggerFactory.getLogger(OllamaConfig.class);

    @Value("${spring.ai.ollama.base-url:http://localhost:11434}")
    private String ollamaBaseUrl;

    @Bean
    @Primary
    public OllamaApi ollamaApi() {
        log.info("Configuring OllamaApi with base-url={} and readTimeout=10min", ollamaBaseUrl);

        // 10-minute read timeout for large LLM prompts (default is ~60s)
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(10_000);       // 10 s connect
        requestFactory.setReadTimeout(10 * 60 * 1000);  // 10 min read

        RestClient.Builder restClientBuilder = RestClient.builder()
                .baseUrl(ollamaBaseUrl)
                .requestFactory(requestFactory);

        // WebClient handles streaming; increase in-memory buffer for large responses
        WebClient.Builder webClientBuilder = WebClient.builder()
                .baseUrl(ollamaBaseUrl)
                .codecs(config -> config.defaultCodecs().maxInMemorySize(10 * 1024 * 1024));

        return new OllamaApi(ollamaBaseUrl, restClientBuilder, webClientBuilder);
    }
}
