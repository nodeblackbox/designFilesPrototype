#!/bin/bash

# Directories to be created
declare -a dirs=(
"config"
"controllers"
"models"
"routes"
)

# Files to be created inside controllers directory
declare -a controllers=(
"adminController.js"
"affiliateController.js"
"apiController.js"
"blogController.js"
"coursesController.js"
"galleryController.js"
"shopController.js"
"userController.js"
"authController.js"
"contactController.js"
"homeController.js"
"plansController.js"
)

# Files to be created inside models directory
declare -a models=(
"adminModel.js"
"affiliateModel.js"
"apiModel.js"
"blogModel.js"
"coursesModel.js"
"galleryModel.js"
"shopModel.js"
"userModel.js"
"authModel.js"
"contactModel.js"
"homeModel.js"
"plansModel.js"
)

# Files to be created inside routes directory
declare -a routes=(
"adminRoutes.js"
"affiliateRoutes.js"
"apiRoutes.js"
"blogRoutes.js"
"coursesRoutes.js"
"galleryRoutes.js"
"shopRoutes.js"
"userRoutes.js"
"authRoutes.js"
"contactRoutes.js"
"homeRoutes.js"
"plansRoutes.js"
)

# Create directories
for dir in "${dirs[@]}"
do
  if [ ! -d "$dir" ]; then
    mkdir $dir
  fi
done

# Create files in controllers
for file in "${controllers[@]}"
do
  touch "controllers/$file"
done

# Create files in models
for file in "${models[@]}"
do
  touch "models/$file"
done

# Create files in routes
for file in "${routes[@]}"
do
  touch "routes/$file"
done

# Additional file in config
touch "config/dbConfig.js"

echo "Directory structure and files created successfully!"
