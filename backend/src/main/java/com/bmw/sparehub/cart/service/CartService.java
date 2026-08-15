package com.bmw.sparehub.cart.service;

import com.bmw.sparehub.cart.dto.AddToCartRequest;
import com.bmw.sparehub.cart.dto.CartDto;
import com.bmw.sparehub.cart.dto.CartItemDto;
import com.bmw.sparehub.cart.dto.UpdateCartItemRequest;
import com.bmw.sparehub.cart.entity.Cart;
import com.bmw.sparehub.cart.entity.CartItem;
import com.bmw.sparehub.cart.repository.CartItemRepository;
import com.bmw.sparehub.cart.repository.CartRepository;
import com.bmw.sparehub.exception.BadRequestException;
import com.bmw.sparehub.exception.ResourceNotFoundException;
import com.bmw.sparehub.inventory.entity.Inventory;
import com.bmw.sparehub.inventory.repository.InventoryRepository;
import com.bmw.sparehub.product.entity.Product;
import com.bmw.sparehub.product.repository.ProductRepository;
import com.bmw.sparehub.product.service.ProductService;
import com.bmw.sparehub.user.entity.User;
import com.bmw.sparehub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final InventoryRepository inventoryRepository;
    private final ProductService productService;

    public CartDto getOrCreateCart(UUID userId) {
        Cart cart = cartRepository.findByUserId(userId).orElseGet(() -> {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
            Cart newCart = Cart.builder().user(user).items(new ArrayList<>()).build();
            return cartRepository.save(newCart);
        });

        return mapToDto(cart);
    }

    @Transactional
    public CartDto addToCart(UUID userId, AddToCartRequest request) {
        Cart cart = cartRepository.findByUserId(userId).orElseGet(() -> {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
            return cartRepository.save(Cart.builder().user(user).items(new ArrayList<>()).build());
        });

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", request.getProductId()));

        Inventory inv = inventoryRepository.findByProductId(product.getId()).orElse(null);
        int available = inv != null ? inv.getAvailableQuantity() : 0;
        if (available <= 0) {
            throw new BadRequestException("Product is currently OUT OF STOCK");
        }

        if (cart.getItems() == null) {
            cart.setItems(new ArrayList<>());
        }

        CartItem existingItem = cart.getItems().stream()
                .filter(i -> i.getProduct().getId().equals(product.getId()))
                .findFirst()
                .orElse(null);

        int targetQuantity = request.getQuantity();
        if (existingItem != null) {
            targetQuantity += existingItem.getQuantity();
        }

        if (targetQuantity > available) {
            throw new BadRequestException("Requested quantity (" + targetQuantity + ") exceeds available stock (" + available + ")");
        }

        if (existingItem != null) {
            existingItem.setQuantity(targetQuantity);
        } else {
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(request.getQuantity())
                    .build();
            cart.getItems().add(newItem);
        }

        cart = cartRepository.saveAndFlush(cart);
        log.info("User {} added product {} to cart (qty: {})", userId, product.getPartNumber(), request.getQuantity());
        return mapToDto(cart);
    }

    @Transactional
    public CartDto updateCartItem(UUID userId, UUID itemId, UpdateCartItemRequest request) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart for user: " + userId));

        if (request.getQuantity() <= 0) {
            return removeCartItem(userId, itemId);
        }

        if (cart.getItems() == null) {
            throw new ResourceNotFoundException("CartItem", "id", itemId);
        }

        CartItem item = cart.getItems().stream()
                .filter(i -> i.getId() != null && i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("CartItem", "id", itemId));

        Inventory inv = inventoryRepository.findByProductId(item.getProduct().getId()).orElse(null);
        int available = inv != null ? inv.getAvailableQuantity() : 0;

        if (request.getQuantity() > available) {
            throw new BadRequestException("Requested quantity exceeds available stock (" + available + ")");
        }

        item.setQuantity(request.getQuantity());
        cart = cartRepository.saveAndFlush(cart);

        return mapToDto(cart);
    }

    @Transactional
    public CartDto removeCartItem(UUID userId, UUID itemId) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart for user: " + userId));

        if (cart.getItems() != null) {
            cart.getItems().removeIf(item -> item.getId() != null && item.getId().equals(itemId));
        }

        cart = cartRepository.saveAndFlush(cart);
        return mapToDto(cart);
    }

    @Transactional
    public void clearCart(UUID userId) {
        Cart cart = cartRepository.findByUserId(userId).orElse(null);
        if (cart != null) {
            if (cart.getItems() != null) {
                cart.getItems().clear();
            }
            cartRepository.saveAndFlush(cart);
        }
    }

    public CartDto mapToDto(Cart cart) {
        BigDecimal subtotal = BigDecimal.ZERO;
        int totalItems = 0;
        List<CartItemDto> itemDtos = new ArrayList<>();

        if (cart.getItems() != null) {
            for (CartItem item : cart.getItems()) {
                BigDecimal itemTotal = item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                subtotal = subtotal.add(itemTotal);
                totalItems += item.getQuantity();

                itemDtos.add(CartItemDto.builder()
                        .id(item.getId())
                        .product(productService.mapProductToDto(item.getProduct()))
                        .quantity(item.getQuantity())
                        .itemTotal(itemTotal)
                        .build());
            }
        }

        return CartDto.builder()
                .id(cart.getId())
                .userId(cart.getUser().getId())
                .items(itemDtos)
                .subtotal(subtotal)
                .totalItems(totalItems)
                .build();
    }
}
