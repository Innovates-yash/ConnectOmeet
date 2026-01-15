package com.gameverse.controller;

import com.gameverse.entity.User;
import com.gameverse.service.GameCoinService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for GameCoinController
 */
@WebMvcTest(GameCoinController.class)
class GameCoinControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private GameCoinService gameCoinService;

    @Autowired
    private ObjectMapper objectMapper;

    private User testUser;
    private Authentication mockAuth;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setPhoneNumber("+1234567890");
        testUser.setGameCoins(BigDecimal.valueOf(1000));
        testUser.setIsVerified(true);

        mockAuth = new UsernamePasswordAuthenticationToken(testUser, null, new ArrayList<>());
    }

    @Test
    void getBalance_ShouldReturnUserBalance() throws Exception {
        // Given
        when(gameCoinService.getUserBalance(1L)).thenReturn(BigDecimal.valueOf(1000));

        // When & Then
        mockMvc.perform(get("/gamecoins/balance")
                .with(authentication(mockAuth))
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.balance").value(1000))
                .andExpect(jsonPath("$.userId").value(1))
                .andExpect(jsonPath("$.formattedBalance").value("1000 GameCoins"));
    }

    @Test
    void checkBalance_ShouldReturnSufficientBalanceTrue() throws Exception {
        // Given
        when(gameCoinService.hasSufficientBalance(1L, BigDecimal.valueOf(500))).thenReturn(true);
        when(gameCoinService.getUserBalance(1L)).thenReturn(BigDecimal.valueOf(1000));

        // When & Then
        mockMvc.perform(get("/gamecoins/balance/check")
                .param("amount", "500")
                .with(authentication(mockAuth))
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasSufficientBalance").value(true))
                .andExpect(jsonPath("$.currentBalance").value(1000))
                .andExpect(jsonPath("$.requiredAmount").value(500))
                .andExpect(jsonPath("$.shortfall").value(0));
    }

    @Test
    void checkBalance_ShouldReturnSufficientBalanceFalse() throws Exception {
        // Given
        when(gameCoinService.hasSufficientBalance(1L, BigDecimal.valueOf(1500))).thenReturn(false);
        when(gameCoinService.getUserBalance(1L)).thenReturn(BigDecimal.valueOf(1000));

        // When & Then
        mockMvc.perform(get("/gamecoins/balance/check")
                .param("amount", "1500")
                .with(authentication(mockAuth))
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasSufficientBalance").value(false))
                .andExpect(jsonPath("$.currentBalance").value(1000))
                .andExpect(jsonPath("$.requiredAmount").value(1500))
                .andExpect(jsonPath("$.shortfall").value(500));
    }

    @Test
    void getGamePricing_ShouldReturnPricingInformation() throws Exception {
        // Given
        when(gameCoinService.getGameEntryFee("RUMMY")).thenReturn(BigDecimal.valueOf(50));
        when(gameCoinService.getGameReward("CHESS")).thenReturn(BigDecimal.valueOf(50));

        // When & Then
        mockMvc.perform(get("/gamecoins/game-pricing")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.entryFees.RUMMY").value(50))
                .andExpect(jsonPath("$.rewards.CHESS").value(50))
                .andExpect(jsonPath("$.dailyBonus").value(50))
                .andExpect(jsonPath("$.memeWinnerBonus").value(200));
    }

    @Test
    void verifyBalance_ShouldReturnVerificationResult() throws Exception {
        // Given
        when(gameCoinService.verifyBalanceIntegrity(1L)).thenReturn(true);
        when(gameCoinService.getUserBalance(1L)).thenReturn(BigDecimal.valueOf(1000));

        // When & Then
        mockMvc.perform(get("/gamecoins/verify-balance")
                .with(authentication(mockAuth))
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isValid").value(true))
                .andExpect(jsonPath("$.currentBalance").value(1000))
                .andExpect(jsonPath("$.message").value("Balance verified successfully"));
    }

    @Test
    void checkBalance_WithNegativeAmount_ShouldReturnBadRequest() throws Exception {
        // When & Then
        mockMvc.perform(get("/gamecoins/balance/check")
                .param("amount", "-100")
                .with(authentication(mockAuth))
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Amount must be positive"))
                .andExpect(jsonPath("$.hasSufficientBalance").value(false));
    }
}