package com.ordering.retail.Service;

import com.ordering.retail.DTOs.AuthResponseDTO;
import com.ordering.retail.DTOs.LoginRequestDTO;
import com.ordering.retail.DTOs.SignupRequestDTO;
import com.ordering.retail.Entity.User;
import com.ordering.retail.Enum.Role;
import com.ordering.retail.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    /**
     * Login user with email and password
     */
    public AuthResponseDTO login(LoginRequestDTO request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        // Simple password comparison (in production use BCrypt)
        if (!user.getPasswordHash().equals(request.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        return mapToAuthResponse(user);
    }

    /**
     * Sign up new user
     */
    public AuthResponseDTO signup(SignupRequestDTO request) {
        // Check if email already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        // Create new user
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        // In production, hash the password using BCrypt
        user.setPasswordHash(request.getPassword());
        user.setRole(Role.USER);
        user.setLoyaltyPoints(0);

        user = userRepository.save(user);
        return mapToAuthResponse(user);
    }

    /**
     * Map User entity to AuthResponseDTO
     */
    private AuthResponseDTO mapToAuthResponse(User user) {
        return new AuthResponseDTO(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().toString()
        );
    }
}
