package com.ordering.retail.Service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ordering.retail.DTOs.CouponRequestDTO;
import com.ordering.retail.DTOs.CouponResponseDTO;
import com.ordering.retail.Entity.Coupon;
import com.ordering.retail.Exception.ResourceNotFoundException;
import com.ordering.retail.Repository.CouponRepository;

@Service
@Transactional
public class CouponService {

    private final CouponRepository couponRepository;
    private final CouponNotificationService couponNotificationService;

    public CouponService(CouponRepository couponRepository, CouponNotificationService couponNotificationService) {
        this.couponRepository = couponRepository;
        this.couponNotificationService = couponNotificationService;
    }

    private Coupon checkAndExpireCoupon(Coupon coupon) {
        if (Boolean.TRUE.equals(coupon.getActive()) && coupon.getExpiryDate() != null
                && coupon.getExpiryDate().isBefore(LocalDate.now())) {
            coupon.setActive(false);
            return couponRepository.save(coupon);
        }
        return coupon;
    }

    public List<CouponResponseDTO> findAll() {
        return couponRepository.findAll().stream().map(this::checkAndExpireCoupon).map(this::toResponse).toList();
    }

    public CouponResponseDTO findById(Long id) {
        return toResponse(checkAndExpireCoupon(getCouponEntity(id)));
    }

    public CouponResponseDTO findByCode(String code) {
        Coupon coupon = couponRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found for code: " + code));
        return toResponse(checkAndExpireCoupon(coupon));
    }

    public CouponResponseDTO create(CouponRequestDTO request) {
        if (couponRepository.existsByCode(request.code())) {
            throw new IllegalArgumentException("Coupon code already exists: " + request.code());
        }

        Coupon coupon = new Coupon();
        applyRequest(coupon, request);
        Coupon saved = couponRepository.save(coupon);
        couponNotificationService.sendNewCouponAnnouncement(saved);
        return toResponse(saved);
    }

    public CouponResponseDTO update(Long id, CouponRequestDTO request) {
        Coupon coupon = getCouponEntity(id);
        applyRequest(coupon, request);
        return toResponse(couponRepository.save(coupon));
    }

    public void delete(Long id) {
        couponRepository.delete(getCouponEntity(id));
    }

    public Coupon resolveValidCoupon(String code) {
        Coupon coupon = couponRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found for code: " + code));

        coupon = checkAndExpireCoupon(coupon);

        if (!Boolean.TRUE.equals(coupon.getActive())) {
            throw new IllegalArgumentException("Coupon is inactive: " + code);
        }
        if (coupon.getExpiryDate() != null && coupon.getExpiryDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Coupon is expired: " + code);
        }
        if (coupon.getUsageLimit() != null && coupon.getUsedCount() != null
                && coupon.getUsedCount() >= coupon.getUsageLimit()) {
            throw new IllegalArgumentException("Coupon usage limit reached: " + code);
        }

        return coupon;
    }

    public Coupon incrementUsage(Coupon coupon) {
        coupon.setUsedCount(coupon.getUsedCount() == null ? 1 : coupon.getUsedCount() + 1);
        return couponRepository.save(coupon);
    }

    public CouponResponseDTO setActive(Long id, boolean active) {
        Coupon coupon = getCouponEntity(id);
        coupon.setActive(active);
        return toResponse(couponRepository.save(coupon));
    }

    private Coupon getCouponEntity(Long id) {
        return couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found with id: " + id));
    }

    private void applyRequest(Coupon coupon, CouponRequestDTO request) {
        coupon.setCode(request.code());
        coupon.setType(request.type());
        coupon.setValue(request.value());
        coupon.setExpiryDate(request.expiryDate());
        coupon.setActive(request.active() == null ? Boolean.TRUE : request.active());
        coupon.setUsageLimit(request.usageLimit());
        if (coupon.getUsedCount() == null) {
            coupon.setUsedCount(0);
        }
    }

    private CouponResponseDTO toResponse(Coupon coupon) {
        return new CouponResponseDTO(
                coupon.getId(),
                coupon.getCode(),
                coupon.getType(),
                coupon.getValue(),
                coupon.getExpiryDate(),
                coupon.getActive(),
                coupon.getUsageLimit(),
                coupon.getUsedCount());
    }
}