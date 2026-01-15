package com.gameverse.service;

import com.gameverse.entity.User;
import com.gameverse.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * User Service
 * 
 * Handles user management and profile operations.
 */
@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    /**
     * Load user by ID for JWT authentication
     */
    public UserDetails loadUserById(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        
        if (userOpt.isEmpty()) {
            throw new UsernameNotFoundException("User not found with ID: " + userId);
        }

        return userOpt.get();
    }

    /**
     * Load user by phone number
     */
    public UserDetails loadUserByPhoneNumber(String phoneNumber) {
        Optional<User> userOpt = userRepository.findByPhoneNumber(phoneNumber);
        
        if (userOpt.isEmpty()) {
            throw new UsernameNotFoundException("User not found with phone number: " + phoneNumber);
        }

        return userOpt.get();
    }

    /**
     * Find user by ID
     */
    public Optional<User> findById(Long userId) {
        return userRepository.findById(userId);
    }

    /**
     * Find user by phone number
     */
    public Optional<User> findByPhoneNumber(String phoneNumber) {
        return userRepository.findByPhoneNumber(phoneNumber);
    }

    /**
     * Check if user exists by phone number
     */
    public boolean existsByPhoneNumber(String phoneNumber) {
        return userRepository.existsByPhoneNumber(phoneNumber);
    }

    /**
     * Save user
     */
    public User save(User user) {
        return userRepository.save(user);
    }
}