package com.gameverse.entity;

import jakarta.persistence.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Collections;

/**
 * User entity representing registered users in the GameVerse platform
 */
@Entity
@Table(name = "users")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "phone_number", unique = true, nullable = false, length = 15)
    private String phoneNumber;

    @Column(name = "is_verified", nullable = false)
    private Boolean isVerified = false;

    @Column(name = "game_coins", precision = 10, scale = 2)
    private BigDecimal gameCoins = BigDecimal.valueOf(1000.00);

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Profile profile;

    // Constructors
    public User() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public User(String phoneNumber) {
        this();
        this.phoneNumber = phoneNumber;
    }

    // UserDetails implementation
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // For now, all users have the same basic authority
        // In the future, we can implement roles (USER, ADMIN, MODERATOR)
        return Collections.emptyList();
    }

    @Override
    public String getPassword() {
        // We don't use passwords - authentication is via OTP
        return null;
    }

    @Override
    public String getUsername() {
        // Use phone number as username
        return phoneNumber;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return isVerified;
    }

    // JPA lifecycle callbacks
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public Boolean getIsVerified() {
        return isVerified;
    }

    public void setIsVerified(Boolean isVerified) {
        this.isVerified = isVerified;
    }

    public BigDecimal getGameCoins() {
        return gameCoins;
    }

    public void setGameCoins(BigDecimal gameCoins) {
        this.gameCoins = gameCoins;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    // Business methods
    public void verify() {
        this.isVerified = true;
    }

    public void addGameCoins(BigDecimal amount) {
        this.gameCoins = this.gameCoins.add(amount);
    }

    public void subtractGameCoins(BigDecimal amount) {
        if (this.gameCoins.compareTo(amount) >= 0) {
            this.gameCoins = this.gameCoins.subtract(amount);
        } else {
            throw new IllegalArgumentException("Insufficient game coins");
        }
    }

    public boolean hasProfile() {
        return profile != null;
    }

    public Profile getProfile() {
        return profile;
    }

    public void setProfile(Profile profile) {
        this.profile = profile;
        if (profile != null) {
            profile.setUser(this);
        }
    }

    @Override
    public String toString() {
        return "User{" +
                "id=" + id +
                ", phoneNumber='" + phoneNumber + '\'' +
                ", isVerified=" + isVerified +
                ", gameCoins=" + gameCoins +
                ", createdAt=" + createdAt +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof User)) return false;
        User user = (User) o;
        return id != null && id.equals(user.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}