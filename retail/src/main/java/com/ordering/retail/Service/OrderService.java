package com.ordering.retail.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.ordering.retail.DTOs.OrderItemRequestDTO;
import com.ordering.retail.DTOs.OrderItemResponseDTO;
import com.ordering.retail.DTOs.OrderRequestDTO;
import com.ordering.retail.DTOs.OrderResponseDTO;
import com.ordering.retail.Entity.Coupon;
import com.ordering.retail.Entity.Order;
import com.ordering.retail.Entity.OrderItem;
import com.ordering.retail.Entity.User;
import com.ordering.retail.Enum.DiscountType;
import com.ordering.retail.Enum.OrderStatus;
import com.ordering.retail.Exception.ResourceNotFoundException;
import com.ordering.retail.Repository.CouponRepository;
import com.ordering.retail.Repository.OrderRepository;
import com.ordering.retail.Repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final CouponRepository couponRepository;
    private final OrderNotificationService orderNotificationService;

    public OrderService(OrderRepository orderRepository, UserRepository userRepository, CouponRepository couponRepository,
            OrderNotificationService orderNotificationService) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.couponRepository = couponRepository;
        this.orderNotificationService = orderNotificationService;
    }

    @Transactional(readOnly = true)
    public List<OrderResponseDTO> findAll() {
        return orderRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public OrderResponseDTO findById(Long id) {
        return toResponse(getOrderEntity(id));
    }

    @Transactional(readOnly = true)
    public List<OrderResponseDTO> findByUserId(Long userId) {
        return orderRepository.findByUserId(userId).stream().map(this::toResponse).toList();
    }

    public OrderResponseDTO create(OrderRequestDTO request) {
        Order order = new Order();
        applyRequest(order, request, true);
        Order saved = orderRepository.save(order);
        orderNotificationService.sendOrderStatusEmail(saved);
        return toResponse(saved);
    }

    public OrderResponseDTO update(Long id, OrderRequestDTO request) {
        Order order = getOrderEntity(id);
        applyRequest(order, request, false);
        return toResponse(orderRepository.save(order));
    }

    public OrderResponseDTO updateStatus(Long id, OrderStatus status) {
        Order order = getOrderEntity(id);
        OrderStatus previousStatus = order.getStatus();
        order.setStatus(status);
        if (status == OrderStatus.DELIVERED && order.getDeliveredAt() == null) {
            order.setDeliveredAt(LocalDateTime.now());
        }
        Order saved = orderRepository.save(order);
        if (previousStatus != status) {
            orderNotificationService.sendOrderStatusEmail(saved);
        }
        return toResponse(saved);
    }

    public void delete(Long id) {
        orderRepository.delete(getOrderEntity(id));
    }

    private Order getOrderEntity(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
    }

    private void applyRequest(Order order, OrderRequestDTO request, boolean isCreate) {
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.userId()));

        order.setUser(user);
        order.setDeliveryAddress(request.deliveryAddress());
        order.setStatus(request.status() == null ? OrderStatus.PENDING : request.status());

        List<OrderItem> items = buildItems(order, request.items());
        order.setItems(items);

        BigDecimal subtotal = calculateSubtotal(items);
        String couponCode = normalizeCouponCode(request.couponCode());
        BigDecimal discount = BigDecimal.ZERO;

        if (couponCode != null) {
            Coupon coupon = couponRepository.findByCode(couponCode)
                    .orElseThrow(() -> new ResourceNotFoundException("Coupon not found for code: " + couponCode));
            validateCoupon(coupon);
            discount = calculateDiscount(subtotal, coupon);
            order.setCouponCode(coupon.getCode());
            order.setDiscount(discount);

            if (isCreate) {
                coupon.setUsedCount(coupon.getUsedCount() == null ? 1 : coupon.getUsedCount() + 1);
                couponRepository.save(coupon);
            }
        } else {
            order.setCouponCode(null);
            order.setDiscount(BigDecimal.ZERO);
        }

        order.setTotalAmount(subtotal.subtract(discount).max(BigDecimal.ZERO));
        if (order.getPlacedAt() == null) {
            order.setPlacedAt(LocalDateTime.now());
        }
    }

    private List<OrderItem> buildItems(Order order, List<OrderItemRequestDTO> requestItems) {
        List<OrderItem> items = new ArrayList<>();
        if (requestItems == null) {
            return items;
        }

        for (OrderItemRequestDTO requestItem : requestItems) {
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProductId(requestItem.productId());
            orderItem.setQuantity(requestItem.quantity());
            orderItem.setPriceAtTime(requestItem.priceAtTime());
            items.add(orderItem);
        }

        return items;
    }

    private BigDecimal calculateSubtotal(List<OrderItem> items) {
        BigDecimal subtotal = BigDecimal.ZERO;
        for (OrderItem item : items) {
            BigDecimal itemTotal = item.getPriceAtTime().multiply(BigDecimal.valueOf(item.getQuantity()));
            subtotal = subtotal.add(itemTotal);
        }
        return subtotal;
    }

    private BigDecimal calculateDiscount(BigDecimal subtotal, Coupon coupon) {
        if (coupon.getValue() == null) {
            return BigDecimal.ZERO;
        }

        if (coupon.getType() == DiscountType.PERCENTAGE) {
            return subtotal
                    .multiply(coupon.getValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }

        return coupon.getValue().min(subtotal);
    }

    private void validateCoupon(Coupon coupon) {
        if (!Boolean.TRUE.equals(coupon.getActive())) {
            throw new IllegalArgumentException("Coupon is inactive: " + coupon.getCode());
        }
        if (coupon.getExpiryDate() != null && coupon.getExpiryDate().isBefore(java.time.LocalDate.now())) {
            throw new IllegalArgumentException("Coupon is expired: " + coupon.getCode());
        }
        if (coupon.getUsageLimit() != null && coupon.getUsedCount() != null && coupon.getUsedCount() >= coupon.getUsageLimit()) {
            throw new IllegalArgumentException("Coupon usage limit reached: " + coupon.getCode());
        }
    }

    private String normalizeCouponCode(String couponCode) {
        if (couponCode == null || couponCode.isBlank()) {
            return null;
        }
        return couponCode.trim();
    }

    private OrderResponseDTO toResponse(Order order) {
        List<OrderItemResponseDTO> items = order.getItems().stream().map(this::toResponse).toList();
        return new OrderResponseDTO(
                order.getId(),
                order.getUser() == null ? null : order.getUser().getId(),
                order.getStatus(),
                order.getTotalAmount(),
                order.getDeliveryAddress(),
                order.getCouponCode(),
                order.getDiscount(),
                order.getPlacedAt(),
                order.getDeliveredAt(),
                items);
    }

    private OrderItemResponseDTO toResponse(OrderItem orderItem) {
        return new OrderItemResponseDTO(
                orderItem.getId(),
                orderItem.getOrder() == null ? null : orderItem.getOrder().getId(),
                orderItem.getProductId(),
                orderItem.getQuantity(),
                orderItem.getPriceAtTime());
    }
}