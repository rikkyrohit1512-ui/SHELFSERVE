package com.shelfsense.config;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.http.HttpMethod;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SecurityConfigCorsTest {

    @Test
    void allowsCredentialedPreflightOnlyFromConfiguredOrigins() {
        CorsConfigurationSource source = new SecurityConfig()
                .corsConfigurationSource(
                        "https://frontend.example,http://localhost:5501");
        MockHttpServletRequest request =
                new MockHttpServletRequest("OPTIONS", "/api/v1/members");
        CorsConfiguration configuration = source.getCorsConfiguration(request);

        assertNotNull(configuration);
        assertEquals(
                "https://frontend.example",
                configuration.checkOrigin("https://frontend.example"));
        assertEquals(
                "http://localhost:5501",
                configuration.checkOrigin("http://localhost:5501"));
        assertNull(configuration.checkOrigin("https://untrusted.example"));
        assertTrue(configuration.getAllowCredentials());
        assertNotNull(configuration.checkHttpMethod(HttpMethod.OPTIONS));
        assertNotNull(configuration.checkHeaders(
                List.of("Authorization", "Content-Type")));
    }
}
