package com.ordering.retail.Config;

import com.ordering.retail.Entity.Product;
import com.ordering.retail.Entity.User;
import com.ordering.retail.Enum.Role;
import com.ordering.retail.Repository.ProductRepository;
import com.ordering.retail.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Bean
    public CommandLineRunner initializeData() {
        return args -> {
            // Initialize demo users if they don't exist
            if (userRepository.count() == 0) {
                User admin = new User("Admin User", "admin@retailos.com", "Admin@1234", "9876543210", "123 Admin St", Role.ADMIN);
                User user1 = new User("John Doe", "john@retailos.com", "User@1234", "9876543211", "456 User Ave", Role.USER);
                User user2 = new User("Jane Smith", "jane@retailos.com", "User@1234", "9876543212", "789 Smith Rd", Role.USER);
                
                userRepository.save(admin);
                userRepository.save(user1);
                userRepository.save(user2);
            }

            // Initialize demo products if they don't exist
            if (productRepository.count() == 0) {
                // Retail Items
                productRepository.save(new Product("Premium Wireless Headphones", 2999.0));
                productRepository.save(new Product("USB-C Fast Charger", 799.0));
                productRepository.save(new Product("Phone Screen Protector (Pack of 3)", 499.0));
                productRepository.save(new Product("Portable Power Bank 20000mAh", 1799.0));
                productRepository.save(new Product("Bluetooth Speaker", 1499.0));
                productRepository.save(new Product("Phone Case Protective", 599.0));
                productRepository.save(new Product("Wireless Mouse", 899.0));
                productRepository.save(new Product("USB Hub 7-Port", 1299.0));
                productRepository.save(new Product("HDMI Cable 2m", 399.0));
                productRepository.save(new Product("Laptop Stand Adjustable", 1599.0));
                
                // Kitchen/Food Items (demo)
                productRepository.save(new Product("Olive Oil Premium 500ml", 449.0));
                productRepository.save(new Product("Basmati Rice 1kg", 299.0));
                productRepository.save(new Product("Dark Chocolate Bar 100g", 199.0));
                productRepository.save(new Product("Almond Nuts 250g", 399.0));
                productRepository.save(new Product("Green Tea Bags (25 pack)", 249.0));
                productRepository.save(new Product("Honey Natural 500ml", 549.0));
                productRepository.save(new Product("Pasta Whole Wheat 500g", 179.0));
                productRepository.save(new Product("Coffee Beans Premium 250g", 349.0));
                productRepository.save(new Product("Cashew Nuts 250g", 449.0));
                productRepository.save(new Product("Cooking Oil Refined 1L", 179.0));
            }
        };
    }
}
