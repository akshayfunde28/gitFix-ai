package com.gitfix.webhook;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SignatureVerifierTest {

    private SignatureVerifier verifier;
    private static final String TEST_SECRET = "super-secret-webhook-key-12345";

    @BeforeEach
    void setUp() {
        verifier = new SignatureVerifier();
    }

    @Test
    void shouldAcceptValidSignature() throws Exception {
        String payload = "{\"action\":\"opened\",\"issue\":{\"number\":42}}";
        byte[] payloadBytes = payload.getBytes(StandardCharsets.UTF_8);

        String signature = computeSignature(payloadBytes, TEST_SECRET);

        boolean isValid = verifier.verifySignature(payloadBytes, signature, TEST_SECRET);
        assertTrue(isValid, "Valid signature must be accepted");
    }

    @Test
    void shouldRejectTamperedPayload() throws Exception {
        String payload = "{\"action\":\"opened\",\"issue\":{\"number\":42}}";
        byte[] payloadBytes = payload.getBytes(StandardCharsets.UTF_8);

        String signature = computeSignature(payloadBytes, TEST_SECRET);

        String tamperedPayload = "{\"action\":\"opened\",\"issue\":{\"number\":43}}";
        boolean isValid = verifier.verifySignature(tamperedPayload.getBytes(StandardCharsets.UTF_8), signature, TEST_SECRET);
        assertFalse(isValid, "Tampered payload must be rejected");
    }

    @Test
    void shouldRejectInvalidSecret() throws Exception {
        String payload = "{\"action\":\"opened\",\"issue\":{\"number\":42}}";
        byte[] payloadBytes = payload.getBytes(StandardCharsets.UTF_8);

        String signature = computeSignature(payloadBytes, TEST_SECRET);

        boolean isValid = verifier.verifySignature(payloadBytes, signature, "wrong-secret");
        assertFalse(isValid, "Invalid secret must be rejected");
    }

    @Test
    void shouldRejectMalformedHeader() {
        String payload = "{\"action\":\"opened\"}";
        byte[] payloadBytes = payload.getBytes(StandardCharsets.UTF_8);

        assertFalse(verifier.verifySignature(payloadBytes, "invalid_header", TEST_SECRET));
        assertFalse(verifier.verifySignature(null, "sha256=abc", TEST_SECRET));
        assertFalse(verifier.verifySignature(payloadBytes, null, TEST_SECRET));
        assertFalse(verifier.verifySignature(payloadBytes, "sha256=abc", null));
    }

    private String computeSignature(byte[] payload, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] hmac = mac.doFinal(payload);
        StringBuilder sb = new StringBuilder("sha256=");
        for (byte b : hmac) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
