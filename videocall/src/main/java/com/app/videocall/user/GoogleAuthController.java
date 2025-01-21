package com.app.videocall.user;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.util.EntityUtils;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
public class GoogleAuthController {

    private static final String CLIENT_ID = "164257842675-aksqluat6fub2tohjp9tjfdkbn9er894.apps.googleusercontent.com";
    private static final String CLIENT_SECRET = "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";
    private static final String REDIRECT_URI = "http://localhost:8080/callback";
    private static final String TOKEN_URL = "https://oauth2.googleapis.com/token";

    /**
     * Redirects the user to Google's OAuth 2.0 authorization endpoint.
     */
    @GetMapping("/google-auth")
    public void redirectToGoogle(HttpServletResponse response) {
        try {
            String googleAuthUrl = "https://accounts.google.com/o/oauth2/v2/auth?" +
                    "scope=" + URLEncoder.encode("https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events", StandardCharsets.UTF_8) + "&" +
                    "response_type=code&" +
                    "redirect_uri=" + URLEncoder.encode(REDIRECT_URI, StandardCharsets.UTF_8) + "&" +
                    "client_id=" + CLIENT_ID;

            response.sendRedirect(googleAuthUrl);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    /**
     * Handles the callback from Google and exchanges the authorization code for access and refresh tokens.
     */
    @GetMapping("/callback")
    public void handleGoogleCallback(@RequestParam("code") String authorizationCode,
                                     HttpServletRequest request, HttpServletResponse response) {
        HttpPost post = new HttpPost(TOKEN_URL);

        try {
            String params = "code=" + URLEncoder.encode(authorizationCode, StandardCharsets.UTF_8) +
                    "&client_id=" + CLIENT_ID +
                    "&client_secret=" + CLIENT_SECRET +
                    "&redirect_uri=" + URLEncoder.encode(REDIRECT_URI, StandardCharsets.UTF_8) +
                    "&grant_type=authorization_code";

            post.setEntity(new StringEntity(params, StandardCharsets.UTF_8));
            post.setHeader("Content-Type", "application/x-www-form-urlencoded");

            try (CloseableHttpResponse httpResponse = HttpClientBuilder.create().build().execute(post)) {
                String responseBody = EntityUtils.toString(httpResponse.getEntity());
                JSONObject jsonResponse = new JSONObject(responseBody);

                if (jsonResponse.has("access_token")) {
                    String accessToken = jsonResponse.getString("access_token");
                    String refreshToken = jsonResponse.optString("refresh_token", null);

                    // Store tokens in session
                    request.getSession().setAttribute("accessToken", accessToken);
                    request.getSession().setAttribute("refreshToken", refreshToken);

                    response.sendRedirect("http://localhost:8080/calender.html");
                } else {
                    response.getWriter().write("Error: " + responseBody);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            try {
                response.getWriter().write("Error during authentication: " + e.getMessage());
            } catch (IOException ioException) {
                ioException.printStackTrace();
            }
        }
    }

    /**
     * Retrieves the user's Google Calendar events.
     */
    @GetMapping("/get-events")
    public String getCalendarEvents(HttpServletRequest request) {
        String accessToken = (String) request.getSession().getAttribute("accessToken");

        if (accessToken == null) {
            return "Access token is not available. Authenticate first.";
        }

        String calendarUrl = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
        HttpGet get = new HttpGet(calendarUrl);
        get.setHeader("Authorization", "Bearer " + accessToken);

        try (CloseableHttpResponse response = HttpClientBuilder.create().build().execute(get)) {
            String responseBody = EntityUtils.toString(response.getEntity());
            JSONObject jsonResponse = new JSONObject(responseBody);

            JSONArray events = jsonResponse.optJSONArray("items");
            if (events != null) {
                StringBuilder eventList = new StringBuilder("Your Calendar Events:\n");
                for (int i = 0; i < events.length(); i++) {
                    JSONObject event = events.getJSONObject(i);
                    eventList.append("Event: ").append(event.optString("summary", "No Title")).append("\n");
                    eventList.append("Start: ").append(event.optJSONObject("start").optString("dateTime", "N/A")).append("\n");
                    eventList.append("End: ").append(event.optJSONObject("end").optString("dateTime", "N/A")).append("\n\n");
                }
                return eventList.toString();
            }
            return "No events found in your calendar.";
        } catch (Exception e) {
            e.printStackTrace();
            return "Failed to retrieve events.";
        }
    }

    /**
     * Adds a new event to the user's Google Calendar.
     */
    @PostMapping("/add-event")
    public String addCalendarEvent(@RequestBody String eventDetails, HttpServletRequest request) {
        String accessToken = (String) request.getSession().getAttribute("accessToken");

        if (accessToken == null) {
            return "Access token is not available. Authenticate first.";
        }

        String calendarUrl = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
        HttpPost post = new HttpPost(calendarUrl);
        post.setHeader("Authorization", "Bearer " + accessToken);
        post.setHeader("Content-Type", "application/json");

        try {
            post.setEntity(new StringEntity(eventDetails, StandardCharsets.UTF_8));

            try (CloseableHttpResponse response = HttpClientBuilder.create().build().execute(post)) {
                String responseBody = EntityUtils.toString(response.getEntity());
                JSONObject jsonResponse = new JSONObject(responseBody);

                if (jsonResponse.has("id")) {
                    return "Event created successfully with ID: " + jsonResponse.getString("id");
                } else {
                    return "Failed to create event: " + responseBody;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            return "Error while creating event: " + e.getMessage();
        }
    }
}
