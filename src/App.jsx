// src/App.jsx
import React, { useState } from "react";
import PropertyImageManager from "./components/PropertyImageManager";
import PropertyGallery from "./components/PropertyGallery";
import ShortlistManager from "./components/ShortlistManager";
import ShortlistRouter from "./components/ShortlistRouter";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";

const backgroundUrl =
  "https://images.unsplash.com/photo-1596654907140-cac29b49fca4?auto=format&fit=crop&w=1200&q=80";

function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <MainApp />
      </ProtectedRoute>
    </AuthProvider>
  );
}

function MainApp() {
  const [activeTab, setActiveTab] = useState("test");

  // Check if we're viewing a shortlist
  const isShortlistUrl = window.location.pathname.includes('/shortlist/') || window.location.hash.includes('/shortlist/');

  // If viewing a shortlist, show only the shortlist viewer
  if (isShortlistUrl) {
    return <ShortlistRouter />;
  }

  // Theme colors
  const theme = {
    primary: "#0d4d4d",
    accent: "#00bfae",
    background: "#0c2d2d",
    card: "#ffffff",
    button: "#00bfae",
    buttonActive: "#0d4d4d",
    text: "#222",
    textLight: "#fff",
    shadow: "0 4px 24px rgba(0,0,0,0.08)",
  };

  // Navigation button component
  const NavButton = ({ isActive, onClick, children, emoji }) => (
    <button
      onClick={onClick}
      style={{
        padding: "12px 28px",
        background: isActive ? theme.button : "#e0f7f7",
        color: isActive ? theme.textLight : theme.primary,
        border: "none",
        borderRadius: 20,
        fontWeight: 600,
        fontSize: 16,
        cursor: "pointer",
        boxShadow: isActive ? theme.shadow : "none",
        transition: "all 0.2s, transform 0.2s",
        outline: "none",
        ...(isActive
          ? {}
          : {
              filter: "brightness(0.98)",
            }),
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = theme.accent;
        e.currentTarget.style.color = "#fff";
        e.currentTarget.style.transform = "translateY(-2px) scale(1.03)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = isActive ? theme.button : "#e0f7f7";
        e.currentTarget.style.color = isActive ? theme.textLight : theme.primary;
        e.currentTarget.style.transform = "none";
      }}
    >
      {emoji} {children}
    </button>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        position: "relative",
        background: `linear-gradient(120deg, #0d4d4d 60%, #00bfae 100%)`,
        backgroundImage: `url(${backgroundUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        fontFamily: "'Inter', 'Nunito', Arial, sans-serif",
        padding: 0,
        margin: 0,
        overflow: "hidden",
      }}
    >
      {/* Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(13,77,77,0.65)",
          zIndex: 0,
        }}
      />
      {/* Main Content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 900,
          margin: "0 auto",
          padding: "40px 16px 32px 16px",
          background: "rgba(255,255,255,0.92)",
          borderRadius: 24,
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          marginTop: 48,
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        <h1
          style={{
            color: theme.primary,
            fontWeight: 800,
            fontSize: 36,
            letterSpacing: "-1px",
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          HouseHunt
        </h1>
        <p
          style={{
            color: "#3a6e6e",
            textAlign: "center",
            marginBottom: 32,
            fontSize: 18,
            fontWeight: 500,
            letterSpacing: "0.2px",
          }}
        >
          Find, list, and manage properties in Kenya with ease.
        </p>

        {/* Navigation Tabs */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 16,
            marginBottom: 32,
            flexWrap: "wrap",
          }}
        >
          <NavButton 
            isActive={activeTab === "test"} 
            onClick={() => setActiveTab("test")} 
            emoji="🏡"
          >
            Home
          </NavButton>
          
          <NavButton 
            isActive={activeTab === "add"} 
            onClick={() => setActiveTab("add")} 
            emoji="➕"
          >
            Add Property
          </NavButton>
          
          <NavButton 
            isActive={activeTab === "gallery"} 
            onClick={() => setActiveTab("gallery")} 
            emoji="🖼️"
          >
            Gallery
          </NavButton>
          
          <NavButton 
            isActive={activeTab === "shortlist"} 
            onClick={() => setActiveTab("shortlist")} 
            emoji="📋"
          >
            Shortlists
          </NavButton>
        </div>

        {/* Tab Content */}
        {activeTab === "test" && (
          <div>
            {/* Hero Section */}
            <div
              style={{
                background: "linear-gradient(135deg, #0d4d4d 0%, #00bfae 100%)",
                borderRadius: 16,
                padding: "40px 32px",
                color: "white",
                textAlign: "center",
                marginBottom: 24,
                boxShadow: "0 8px 32px rgba(0,191,174,0.3)",
              }}
            >
              <h2 style={{ 
                fontSize: 32, 
                fontWeight: 800, 
                marginBottom: 12,
                letterSpacing: "-0.5px"
              }}>
                Welcome to HouseHunt Kenya
              </h2>
              <p style={{ 
                fontSize: 18, 
                opacity: 0.9, 
                lineHeight: 1.6,
                maxWidth: 600,
                margin: "0 auto"
              }}>
                Your premier property management platform connecting landlords, agents, and tenants across Kenya. 
                Streamline property listings, manage client relationships, and close deals faster.
              </p>
              <div style={{
                display: "flex",
                justifyContent: "center",
                gap: 16,
                marginTop: 24,
                flexWrap: "wrap"
              }}>
                <button
                  onClick={() => setActiveTab("add")}
                  style={{
                    padding: "12px 24px",
                    background: "rgba(255,255,255,0.2)",
                    color: "white",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderRadius: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.3s",
                    backdropFilter: "blur(10px)"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.25)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                    e.currentTarget.style.transform = "none";
                  }}
                >
                  List a Property
                </button>
                <button
                  onClick={() => setActiveTab("shortlist")}
                  style={{
                    padding: "12px 24px",
                    background: "white",
                    color: theme.primary,
                    border: "none",
                    borderRadius: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.3s"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  View Shortlists
                </button>
              </div>
            </div>

            {/* Statistics Section */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 20,
                marginBottom: 32
              }}
            >
              {[
                { number: "500+", label: "Properties Listed", icon: "🏠", color: "#00bfae" },
                { number: "250+", label: "Happy Clients", icon: "😊", color: "#0d4d4d" },
                { number: "150+", label: "Successful Matches", icon: "🤝", color: "#ff6b35" },
                { number: "98%", label: "Client Satisfaction", icon: "⭐", color: "#4caf50" }
              ].map((stat, index) => (
                <div
                  key={index}
                  style={{
                    background: "white",
                    padding: 24,
                    borderRadius: 16,
                    textAlign: "center",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    transition: "transform 0.3s, box-shadow 0.3s",
                    cursor: "pointer"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.15)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
                  }}
                >
                  <div style={{ 
                    fontSize: 32, 
                    marginBottom: 8 
                  }}>
                    {stat.icon}
                  </div>
                  <div style={{ 
                    fontSize: 28, 
                    fontWeight: 800, 
                    color: stat.color,
                    marginBottom: 4
                  }}>
                    {stat.number}
                  </div>
                  <div style={{ 
                    color: "#666", 
                    fontSize: 14,
                    fontWeight: 500
                  }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Features Section */}
            <div
              style={{
                background: "#f8fffe",
                borderRadius: 16,
                padding: 32,
                marginBottom: 32,
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
              }}
            >
              <h3 style={{ 
                color: theme.primary, 
                fontSize: 24,
                fontWeight: 700,
                textAlign: "center",
                marginBottom: 24
              }}>
                Why Choose HouseHunt?
              </h3>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: 24
              }}>
                {[
                  {
                    icon: "📱",
                    title: "Mobile-First Design",
                    description: "Access your properties and clients on any device, anywhere in Kenya."
                  },
                  {
                    icon: "🔒",
                    title: "Secure & Reliable",
                    description: "Your data is protected with enterprise-grade security and real-time backups."
                  },
                  {
                    icon: "⚡",
                    title: "Lightning Fast",
                    description: "Upload properties with images in seconds. Create shortlists instantly."
                  },
                  {
                    icon: "🤝",
                    title: "Client Management",
                    description: "Keep track of client preferences and create personalized property recommendations."
                  }
                ].map((feature, index) => (
                  <div
                    key={index}
                    style={{
                      textAlign: "center",
                      padding: 20,
                      transition: "transform 0.3s"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = "translateY(-3px)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = "none";
                    }}
                  >
                    <div style={{ fontSize: 40, marginBottom: 12 }}>
                      {feature.icon}
                    </div>
                    <h4 style={{ 
                      color: theme.primary,
                      fontSize: 18,
                      fontWeight: 600,
                      marginBottom: 8
                    }}>
                      {feature.title}
                    </h4>
                    <p style={{ 
                      color: "#666",
                      fontSize: 14,
                      lineHeight: 1.5
                    }}>
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Client Testimonials */}
            <div
              style={{
                background: "white",
                borderRadius: 16,
                padding: 32,
                marginBottom: 24,
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
              }}
            >
              <h3 style={{ 
                color: theme.primary, 
                fontSize: 24,
                fontWeight: 700,
                textAlign: "center",
                marginBottom: 24
              }}>
                What Our Clients Say
              </h3>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 24
              }}>
                {[
                  {
                    name: "Sarah Mwangi",
                    role: "Property Agent, Nairobi",
                    review: "HouseHunt transformed my property business. I can now manage 50+ properties effortlessly and my clients love the shortlist feature.",
                    rating: 5
                  },
                  {
                    name: "James Kiprop",
                    role: "Real Estate Investor",
                    review: "The platform is incredibly user-friendly. I've connected with more serious tenants in 3 months than I did all last year.",
                    rating: 5
                  },
                  {
                    name: "Grace Achieng",
                    role: "Property Manager",
                    review: "Finally, a system built for the Kenyan market. The mobile experience is exceptional for on-the-go property management.",
                    rating: 5
                  }
                ].map((testimonial, index) => (
                  <div
                    key={index}
                    style={{
                      background: "#f8fffe",
                      padding: 20,
                      borderRadius: 12,
                      borderLeft: `4px solid ${theme.accent}`,
                      transition: "all 0.3s"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = "#f0fffe";
                      e.currentTarget.style.transform = "translateX(4px)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = "#f8fffe";
                      e.currentTarget.style.transform = "none";
                    }}
                  >
                    <div style={{ marginBottom: 12 }}>
                      {"★".repeat(testimonial.rating).split("").map((star, i) => (
                        <span key={i} style={{ color: "#ffc107", fontSize: 16 }}>
                          {star}
                        </span>
                      ))}
                    </div>
                    <p style={{ 
                      color: "#333",
                      fontSize: 14,
                      lineHeight: 1.6,
                      marginBottom: 12,
                      fontStyle: "italic"
                    }}>
                      "{testimonial.review}"
                    </p>
                    <div>
                      <div style={{ 
                        fontWeight: 600,
                        color: theme.primary,
                        fontSize: 14
                      }}>
                        {testimonial.name}
                      </div>
                      <div style={{ 
                        color: "#666",
                        fontSize: 12
                      }}>
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div
              style={{
                background: "linear-gradient(135deg, #f8fffe 0%, #e6fffa 100%)",
                borderRadius: 16,
                padding: 24,
                textAlign: "center"
              }}
            >
              <h4 style={{ 
                color: theme.primary,
                fontSize: 20,
                fontWeight: 600,
                marginBottom: 16
              }}>
                Ready to get started?
              </h4>
              <p style={{
                color: "#666",
                fontSize: 14,
                marginBottom: 20,
                maxWidth: 400,
                margin: "0 auto 20px auto"
              }}>
                Join hundreds of property professionals already using HouseHunt to grow their business.
              </p>
              <div style={{
                display: "flex",
                justifyContent: "center",
                gap: 12,
                flexWrap: "wrap"
              }}>
                <button
                  onClick={() => setActiveTab("add")}
                  style={{
                    padding: "10px 20px",
                    background: theme.button,
                    color: "white",
                    border: "none",
                    borderRadius: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.3s"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,191,174,0.3)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  Add Your First Property
                </button>
                <button
                  onClick={() => setActiveTab("gallery")}
                  style={{
                    padding: "10px 20px",
                    background: "white",
                    color: theme.primary,
                    border: `2px solid ${theme.accent}`,
                    borderRadius: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.3s"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = theme.accent;
                    e.currentTarget.style.color = "white";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "white";
                    e.currentTarget.style.color = theme.primary;
                    e.currentTarget.style.transform = "none";
                  }}
                >
                  Browse Properties
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "add" && <PropertyImageManager />}
        {activeTab === "gallery" && <PropertyGallery />}
        {activeTab === "shortlist" && <ShortlistManager />}
      </div>
    </div>
  );
}

export default App;