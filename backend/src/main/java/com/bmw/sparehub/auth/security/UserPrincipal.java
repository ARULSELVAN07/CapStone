package com.bmw.sparehub.auth.security;

import com.bmw.sparehub.user.entity.User;
import com.bmw.sparehub.user.entity.UserRole;
import com.bmw.sparehub.user.entity.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.UUID;

@Getter
@AllArgsConstructor
public class UserPrincipal implements UserDetails {

    private UUID id;
    private String name;
    private String email;
    private String employeeId;
    private String password;
    private UserRole role;
    private Collection<? extends GrantedAuthority> authorities;

    public static UserPrincipal create(User user) {
        GrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + user.getRole().name());

        String username = user.getEmail() != null ? user.getEmail() : user.getEmployeeId();

        return new UserPrincipal(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getEmployeeId(),
                user.getPasswordHash(),
                user.getRole(),
                Collections.singletonList(authority)
        );
    }

    @Override
    public String getUsername() {
        return email != null ? email : employeeId;
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
        return true;
    }
}
