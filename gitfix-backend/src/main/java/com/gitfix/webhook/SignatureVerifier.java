package com.gitfix.webhook;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Component
public class SignatureVerifier {

    private static final Logger log = LoggerFactory.getLogger(SignatureVerifier.class);
    private static final String HMAC_SHA256 = "HmacSHA256";
    private static final String SIGNATURE_PREFIX = "sha256=";

    /**
     * Verifies GitHub's X-Hub-Signature-256 header using HMAC-SHA256 and constant-time comparison.
     *
     * @param payloadRaw the raw HTTP request body bytes
     * @param signatureHeader the header string (e.g. "sha256=abcdef...")
     * @param secret the webhook secret configured for the connection
     * @return true if valid, false otherwise
     */
    public boolean verifySignature(byte[] payloadRaw, String signatureHeader, String secret) {
        if (payloadRaw == null || signatureHeader == null || secret == null) {
            return false;
        }

        if (!signatureHeader.startsWith(SIGNATURE_PREFIX)) {
            log.warn("Webhook signature missing expected 'sha256=' prefix");
            return false;
        }

        String expectedHash = signatureHeader.substring(SIGNATURE_PREFIX.length()).trim();

        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_SHA256);
            mac.init(secretKeySpec);

            byte[] hmacBytes = mac.doFinal(payloadRaw);
            String computedHash = bytesToHex(hmacBytes);

            // Constant-time comparison to prevent timing attacks
            return MessageDigest.isEqual(
                    expectedHash.getBytes(StandardCharsets.UTF_8),
                    computedHash.getBytes(StandardCharsets.UTF_8)
            );
        } catch (Exception e) {
            log.error("Error computing webhook HMAC signature: {}", e.getMessage(), e);
            return false;
        }
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder hexString = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            hexString.append(String.format("%02x", b));
        }
        return hexString.toString();
    }
}
