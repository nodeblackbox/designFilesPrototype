-- Set up user privileges
CREATE USER 'aiuser'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';
GRANT SELECT, INSERT, UPDATE, DELETE ON aiDashboard.* TO 'aiuser'@'localhost';

-- Create the database and select it
CREATE DATABASE aiDashboard;
USE aiDashboard;


CREATE TABLE userRoles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO userRoles (role_name) VALUES ('admin'), ('user'), ('affiliate');

-- Creating the Subscription Plans Table
CREATE TABLE subscriptionPlans (
    subscription_id INT AUTO_INCREMENT PRIMARY KEY,
    subscription_name VARCHAR(100) NOT NULL,
    features TEXT,
    price DECIMAL(8, 2),
    payment_frequency VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- Creating the Users Table
-- Relationship: One to Many (One subscription can have many users)
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(25) UNIQUE NOT NULL,
    email VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(512) NOT NULL,
    profile_picture VARCHAR(512),
    bio TEXT,
    subscription_id INT,
    role_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES userRoles(role_id),
    FOREIGN KEY (subscription_id) REFERENCES subscriptionPlans(subscription_id)
);

-- Generated Images (was missing)
CREATE TABLE generatedImages (
    image_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    image_url VARCHAR(512) NOT NULL,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Artworks (Gallery)
CREATE TABLE artworks (
    artwork_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    image_url VARCHAR(512) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);


-- Blogs Table
CREATE TABLE blogs (
    blog_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(512),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Extensions Shop Table
CREATE TABLE extensions (
    extension_id INT AUTO_INCREMENT PRIMARY KEY,
    extension_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100),
    price DECIMAL(8, 2),
    monthly_price DECIMAL(8, 2),
    demo_image VARCHAR(512),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User Extensions (Purchased Extensions)
CREATE TABLE userExtensions (
    user_extension_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    extension_id INT,
    active_status BOOLEAN DEFAULT TRUE, -- added column
    last_toggled TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- added column
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (extension_id) REFERENCES extensions(extension_id)
);
-- Affiliate Program Table
CREATE TABLE affiliateProgram (
    affiliate_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    referral_link VARCHAR(512) NOT NULL,
    earned_amount DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Courses Table
CREATE TABLE courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    course_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    video_link VARCHAR(512) NOT NULL,
    price DECIMAL(8, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User Course Enrollment Table
CREATE TABLE userCourses (
    enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    course_id INT,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
);

-- Contact Us Table
CREATE TABLE contactUs (
    contact_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    contact_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);


CREATE TABLE workflows (
    workflow_id INT AUTO_INCREMENT PRIMARY KEY,
    workflow_name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE imageWorkflows (
    image_workflow_id INT AUTO_INCREMENT PRIMARY KEY,
    image_id INT,
    workflow_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (image_id) REFERENCES generatedImages(image_id),
    FOREIGN KEY (workflow_id) REFERENCES workflows(workflow_id)
);


-- User Gallery
CREATE TABLE userGallery (
    gallery_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    image_id INT,
    prompt TEXT,
    image_url VARCHAR(512),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (image_id) REFERENCES generatedImages(image_id)
);

CREATE TABLE enhancementTools (
        tool_id INT AUTO_INCREMENT PRIMARY KEY,
        tool_name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE imageEnhancements (
        enhancement_id INT AUTO_INCREMENT PRIMARY KEY,
        image_id INT,
        tool_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (image_id) REFERENCES generatedImages(image_id),
        FOREIGN KEY (tool_id) REFERENCES enhancementTools(tool_id)
);


-- User Workflows Table (Custom workflows created by users)
CREATE TABLE userWorkflows (
    user_workflow_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    workflow_id INT,
    customization_details TEXT,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (workflow_id) REFERENCES workflows(workflow_id)
);

-- Content Storage Table (Videos, 3D models, etc.)
CREATE TABLE contentStorage (
    content_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    content_type VARCHAR(100), -- e.g., 'video', '3D_model'
    content_path VARCHAR(512) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Transactions and Payments Table (Modified to normalize content references)
CREATE TABLE transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    content_type VARCHAR(100), -- e.g., 'ai_model', 'extension', 'course'
    content_id INT,
    transaction_amount DECIMAL(10,2),
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- AI Models Repository Table
CREATE TABLE aiModels (
    model_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    model_name VARCHAR(255) NOT NULL,
    model_file_path VARCHAR(512) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);


-- Feedback Table
CREATE TABLE feedback (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    feedback_text TEXT NOT NULL,
    feedback_category VARCHAR(100),
    feedback_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);


-- User Analytics Table
CREATE TABLE userMetrics (
    metric_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    session_duration DECIMAL(10,2),  -- In minutes
    feature_used VARCHAR(100),
    usage_count INT DEFAULT 0,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);


-- User Notifications Table
CREATE TABLE userNotifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    notification_type VARCHAR(100), -- e.g., 'transaction', 'feedback'
    content TEXT,
    read_status BOOLEAN DEFAULT FALSE,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);


-- Integration Partners Table
CREATE TABLE integrationPartners (
    partner_id INT AUTO_INCREMENT PRIMARY KEY,
    partner_name VARCHAR(255) NOT NULL,
    api_endpoint VARCHAR(512),
    details TEXT,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);




-- Image Generation Parameters Table
CREATE TABLE imageGenParams (
    param_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    prompt TEXT,
    negative_prompt TEXT,
    steps INT,
    seed INT,
    width INT,
    height INT,
    cfg_scale DECIMAL(5,2),
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
-- AI Image Generation Queue Table
CREATE TABLE aiGenQueue (
    queue_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    param_id INT,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (param_id) REFERENCES imageGenParams(param_id)
);

-- Image Generation Results Table
CREATE TABLE imageGenResults (
    result_id INT AUTO_INCREMENT PRIMARY KEY,
    param_id INT,
    image_url VARCHAR(512) NOT NULL,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (param_id) REFERENCES imageGenParams(param_id)
);

-- API Tokens Table
CREATE TABLE apiTokens (
    token_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    token VARCHAR(512) UNIQUE NOT NULL,
    scope VARCHAR(255),
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiration_date TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);





-- Changelog Table (For updating users on new features and changes)
CREATE TABLE changelog (
    changelog_id INT AUTO_INCREMENT PRIMARY KEY,
    version VARCHAR(50) NOT NULL,
    changes TEXT,
    release_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rate Limits Table (For controlling access frequency)

-- It might be too much for now
CREATE TABLE rateLimits (
    rate_limit_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    endpoint VARCHAR(255),
    requests INT DEFAULT 0,
    max_requests INT DEFAULT 1000, -- Example limit
    reset_duration INT DEFAULT 3600, -- Time in seconds, e.g., 1 hour
    last_request TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Session Management Table (For tracking active sessions)
CREATE TABLE userSessions (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    session_token VARCHAR(512),
    ip_address VARCHAR(45),
    device_info TEXT,
    session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Bookmarks Table (For users to save favorite content)
CREATE TABLE bookmarks (
    bookmark_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    content_type VARCHAR(100), -- e.g., 'blog', 'course', 'ai_model'
    content_id INT,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- User Image History (For users to review their previous image generations)
CREATE TABLE userImageHistory (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    result_id INT,
    viewed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (result_id) REFERENCES imageGenResults(result_id)
);

-- Tags Table (For tagging content for easier search)
CREATE TABLE tags (
    tag_id INT AUTO_INCREMENT PRIMARY KEY,
    tag_name VARCHAR(50) UNIQUE NOT NULL
);

-- Ratings Table (new addition)
CREATE TABLE ratings (
    rating_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    content_type VARCHAR(100), -- e.g., 'blog', 'course', 'ai_model'
    content_id INT,
    rating_value DECIMAL(2,1) CHECK (rating_value BETWEEN 0 AND 5),
    rating_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Content Tags Mapping Table
CREATE TABLE contentTags (
    content_tag_id INT AUTO_INCREMENT PRIMARY KEY,
    tag_id INT,
    content_type VARCHAR(100),
    content_id INT,
    FOREIGN KEY (tag_id) REFERENCES tags(tag_id)
);

-- Themes Table (For customizing user interface)
CREATE TABLE themes (
    theme_id INT AUTO_INCREMENT PRIMARY KEY,
    theme_name VARCHAR(100) NOT NULL,
    theme_css TEXT
);

-- User Themes Table
CREATE TABLE userThemes (
    user_theme_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    theme_id INT,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (theme_id) REFERENCES themes(theme_id)
);



