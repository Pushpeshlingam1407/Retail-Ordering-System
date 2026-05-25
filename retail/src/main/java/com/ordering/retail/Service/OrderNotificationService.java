package com.ordering.retail.Service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import java.util.stream.Collectors;

import com.ordering.retail.Entity.Order;
import com.ordering.retail.Entity.OrderItem;
import com.ordering.retail.Entity.Product;
import com.ordering.retail.Enum.OrderStatus;
import com.ordering.retail.Repository.ProductRepository;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class OrderNotificationService {

    private static final Logger log = LoggerFactory.getLogger(OrderNotificationService.class);

    private final JavaMailSender mailSender;
    private final ProductRepository productRepository;
    private final String fromAddress;

    public OrderNotificationService(
            JavaMailSender mailSender,
            ProductRepository productRepository,
            @Value("${spring.mail.username:}") String fromAddress) {
        this.mailSender = mailSender;
        this.productRepository = productRepository;
        this.fromAddress = fromAddress;
    }

    public void sendOrderStatusEmail(Order order) {
        if (order.getUser() == null || order.getUser().getEmail() == null) {
            return;
        }

        OrderStatus status = order.getStatus();
        if (status != OrderStatus.CONFIRMED && status != OrderStatus.CANCELLED) {
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            if (fromAddress != null && !fromAddress.isBlank()) {
                helper.setFrom(fromAddress);
            }
            helper.setTo(order.getUser().getEmail());
            helper.setSubject("RetailOS order " + status.name().toLowerCase(Locale.ROOT) + " - #" + order.getId());
            helper.setText(buildHtmlBody(order), true);
            mailSender.send(message);
            log.info("Order status email sent for order {} to {}", order.getId(), order.getUser().getEmail());
        } catch (Exception ex) {
            log.warn("Failed to send order notification email for order {}", order.getId(), ex);
        }
    }

    private String buildHtmlBody(Order order) {
        String title = order.getStatus() == OrderStatus.CONFIRMED ? "Order Confirmed" : "Order Cancelled";
        String accent = order.getStatus() == OrderStatus.CONFIRMED ? "#16a34a" : "#dc2626";
        String trackingId = buildTrackingId(order);
        String estimatedDelivery = order.getStatus() == OrderStatus.CONFIRMED ? "2-4 business days" : "N/A";
        Map<Long, String> productNames = productRepository.findAllById(
                order.getItems().stream().map(OrderItem::getProductId).toList())
                .stream()
                .collect(Collectors.toMap(Product::getId, Product::getName));

        String itemsHtml = order.getItems().stream()
                .map(item -> {
                    String productName = productNames.getOrDefault(item.getProductId(), "Product #" + item.getProductId());
                    return "<li style='margin-bottom:8px;'>"
                            + "<strong>" + escape(productName) + "</strong>"
                            + " x " + item.getQuantity()
                            + " - ₹" + item.getPriceAtTime().multiply(java.math.BigDecimal.valueOf(item.getQuantity())).setScale(2)
                            + "</li>";
                })
                .collect(Collectors.joining());

        return "<!doctype html><html><body style='font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a;'>"
                + "<div style='max-width:640px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;'>"
                + "<div style='padding:24px 28px;background:" + accent + ";color:white;'>"
                + "<h1 style='margin:0;font-size:24px;'>" + title + "</h1>"
                + "<p style='margin:8px 0 0;opacity:0.95;'>Order #" + order.getId() + "</p>"
                + "</div>"
                + "<div style='padding:28px;'>"
                + "<p>Hello " + escape(order.getUser().getName()) + ",</p>"
                + "<p>Your order has been <strong>" + order.getStatus().name().toLowerCase(Locale.ROOT) + "</strong>.</p>"
                + "<h2 style='font-size:18px;margin-top:24px;'>Order Details</h2>"
                + "<table style='width:100%;border-collapse:collapse;margin-top:12px;'>"
                + tableRow("Order ID", String.valueOf(order.getId()))
                + tableRow("Status", order.getStatus().name())
                + tableRow("Delivery Address", escape(order.getDeliveryAddress()))
                + tableRow("Tracking ID", escape(trackingId))
                + tableRow("ETA", estimatedDelivery)
                + tableRow("Total", "₹" + order.getTotalAmount())
                + (order.getCouponCode() != null ? tableRow("Coupon", escape(order.getCouponCode())) : "")
                + (order.getDiscount() != null ? tableRow("Discount", "₹" + order.getDiscount()) : "")
                + "</table>"
                + "<h2 style='font-size:18px;margin-top:24px;'>Items</h2>"
                + "<ul style='padding-left:20px;margin-top:12px;'>" + itemsHtml + "</ul>"
                + "</div></div></body></html>";
    }

    private String tableRow(String label, String value) {
        return "<tr><td style='padding:8px 0;color:#475569;width:180px;'>" + escape(label) + "</td><td style='padding:8px 0;font-weight:600;'>" + value + "</td></tr>";
    }

    private String buildTrackingId(Order order) {
        return "RO-" + order.getId() + "-" + String.format(Locale.ROOT, "%04d", order.getUser().getId());
    }

    private String escape(String value) {
        return value == null ? "" : value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}