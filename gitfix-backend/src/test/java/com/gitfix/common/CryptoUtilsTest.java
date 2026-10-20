package com.gitfix.common;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CryptoUtilsTest {

    private CryptoUtils cryptoUtils;
    // 32-byte key base64 encoded
    private static final String TEST_KEY = "on7pdSJ1mYPADmmNKG4752ZPxq/lI0rEqciKmludMF4=";

    @BeforeEach
    void setUp() {
        cryptoUtils = new CryptoUtils(TEST_KEY);
    }

    @Test
    void shouldEncryptAndDecryptSuccessfully() {
        String originalToken = "ghp_TestToken1234567890abcdefghijklmnopqrstuvwxyz";

        String encrypted = cryptoUtils.encrypt(originalToken);
        assertNotNull(encrypted);
        assertNotEquals(originalToken, encrypted);

        String decrypted = cryptoUtils.decrypt(encrypted);
        assertEquals(originalToken, decrypted);
    }

    @Test
    void shouldHandleNullInputs() {
        assertNull(cryptoUtils.encrypt(null));
        assertNull(cryptoUtils.decrypt(null));
    }

    @Test
    void shouldFailWithInvalidKeyLength() {
        assertThrows(IllegalArgumentException.class, () -> new CryptoUtils("dG9vX3Nob3J0"));
    }

    @Test
    void shouldGenerateRandomHexStrings() {
        String hex1 = CryptoUtils.generateRandomHex(16);
        String hex2 = CryptoUtils.generateRandomHex(16);

        assertEquals(32, hex1.length());
        assertEquals(32, hex2.length());
        assertNotEquals(hex1, hex2);
    }
}
