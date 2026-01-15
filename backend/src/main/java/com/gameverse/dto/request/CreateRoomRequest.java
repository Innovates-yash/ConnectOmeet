package com.gameverse.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for creating a new room
 */
public class CreateRoomRequest {
    
    @NotBlank(message = "Room name is required")
    @Size(min = 1, max = 100, message = "Room name must be between 1 and 100 characters")
    private String name;
    
    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;
    
    @Min(value = 2, message = "Maximum capacity must be at least 2")
    @Max(value = 50, message = "Maximum capacity cannot exceed 50")
    private Integer maxCapacity;
    
    public CreateRoomRequest() {}
    
    public CreateRoomRequest(String name, String description, Integer maxCapacity) {
        this.name = name;
        this.description = description;
        this.maxCapacity = maxCapacity;
    }
    
    // Getters and Setters
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public Integer getMaxCapacity() {
        return maxCapacity;
    }
    
    public void setMaxCapacity(Integer maxCapacity) {
        this.maxCapacity = maxCapacity;
    }
}