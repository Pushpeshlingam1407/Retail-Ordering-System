package com.ordering.retail.Config;

import java.util.List;
import java.util.ArrayList;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.ordering.retail.Entity.Inventory;
import com.ordering.retail.Entity.Product;
import com.ordering.retail.Entity.User;
import com.ordering.retail.Entity.Brand;
import com.ordering.retail.Entity.Category;
import com.ordering.retail.Enum.Role;
import com.ordering.retail.Repository.InventoryRepository;
import com.ordering.retail.Repository.ProductRepository;
import com.ordering.retail.Repository.UserRepository;
import com.ordering.retail.Repository.BrandRepository;
import com.ordering.retail.Repository.CategoryRepository;

@Configuration
public class DataInitializer {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private BrandRepository brandRepository;
    
    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner initializeData() {
        return args -> {
            // ── Admin user ──────────────────────────────────────────────
            if (userRepository.findByEmail("admin@retailos.com").isEmpty()) {
                User admin = new User();
                admin.setName("Admin");
                admin.setEmail("admin@retailos.com");
                admin.setPasswordHash(passwordEncoder.encode("Admin@123"));
                admin.setPhone("9999999999");
                admin.setAddress("RetailOS HQ");
                admin.setCity("Mumbai");
                admin.setState("MH");
                admin.setPostalCode("400001");
                admin.setRole(Role.ADMIN);
                admin.setLoyaltyPoints(0);
                userRepository.save(admin);
            }

            // ── Categories (always ensure they exist) ───────────────────
            if (categoryRepository.count() == 0) {
                categoryRepository.save(new Category("Pizza", "Delicious freshly baked pizzas", ""));
                categoryRepository.save(new Category("Cold Drinks", "Refreshing beverages", ""));
                categoryRepository.save(new Category("Breads", "Freshly baked breads and garlic breads", ""));
            }

            // ── Brands (always ensure they exist) ───────────────────────
            if (brandRepository.count() == 0) {
                brandRepository.save(new Brand(null, "Domino's", ""));
                brandRepository.save(new Brand(null, "Coca Cola", ""));
                brandRepository.save(new Brand(null, "Britannia", ""));
                brandRepository.save(new Brand(null, "Pepsi", ""));
            }

            // ── Products + Inventory ─────────────────────────────────────
            if (productRepository.count() == 0) {
                Category pizza    = categoryRepository.findAll().stream().filter(c -> c.getName().equals("Pizza")).findFirst().orElse(categoryRepository.findAll().get(0));
                Category drinks   = categoryRepository.findAll().stream().filter(c -> c.getName().equals("Cold Drinks")).findFirst().orElse(categoryRepository.findAll().get(0));
                Category breads   = categoryRepository.findAll().stream().filter(c -> c.getName().equals("Breads")).findFirst().orElse(categoryRepository.findAll().get(0));

                Brand dominos  = brandRepository.findAll().stream().filter(b -> b.getName().equals("Domino's")).findFirst().orElse(brandRepository.findAll().get(0));
                Brand cocaCola = brandRepository.findAll().stream().filter(b -> b.getName().equals("Coca Cola")).findFirst().orElse(brandRepository.findAll().get(0));
                Brand britannia= brandRepository.findAll().stream().filter(b -> b.getName().equals("Britannia")).findFirst().orElse(brandRepository.findAll().get(0));
                Brand pepsi    = brandRepository.findAll().stream().filter(b -> b.getName().equals("Pepsi")).findFirst().orElse(brandRepository.findAll().get(0));

                java.util.List<Product> products = new java.util.ArrayList<>();
                products.add(createProduct("Margherita Pizza", 199.0, pizza, dominos, "Box"));
                products.add(createProduct("Farmhouse Pizza", 399.0, pizza, dominos, "Box"));
                products.add(createProduct("Peppy Paneer Pizza", 459.0, pizza, dominos, "Box"));
                products.add(createProduct("Veg Extravaganza Pizza", 549.0, pizza, dominos, "Box"));
                products.add(createProduct("Coca Cola 500ml", 40.0, drinks, cocaCola, "Bottle"));
                products.add(createProduct("Diet Coke 300ml", 45.0, drinks, cocaCola, "Can"));
                products.add(createProduct("Pepsi 500ml", 40.0, drinks, pepsi, "Bottle"));
                products.add(createProduct("Sprite 500ml", 40.0, drinks, cocaCola, "Bottle"));
                products.add(createProduct("Garlic Breadsticks", 109.0, breads, dominos, "Box"));
                products.add(createProduct("Stuffed Garlic Bread", 159.0, breads, dominos, "Box"));
                products.add(createProduct("Whole Wheat Bread", 50.0, breads, britannia, "Packet"));
                products.add(createProduct("Multigrain Bread", 65.0, breads, britannia, "Packet"));
                productRepository.saveAll(products);

                for (Product product : productRepository.findAll()) {
                    if (inventoryRepository.findByProductId(product.getId()).isEmpty()) {
                        Inventory inventory = new Inventory();
                        inventory.setProduct(product);
                        inventory.setQuantity(100);
                        inventory.setLowStockThreshold(10);
                        inventoryRepository.save(inventory);
                    }
                }
            }
        };
    }

    
    private Product createProduct(String name, Double price, Category category, Brand brand, String packaging) {
        Product p = new Product(name, price);
        p.setCategory(category);
        p.setBrand(brand);
        p.setPackaging(packaging);
        return p;
    }
}
