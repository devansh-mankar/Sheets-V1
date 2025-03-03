# Spreadsheet Web App

site link:https://sheets-v1.onrender.com

## Overview
This project is a web-based spreadsheet application similar to Google Sheets, allowing users to create, edit, and manage sheets with various data processing functionalities. Users can sign up, log in, and save their work to a database. 

## Features

### 1. User Authentication
- Users can **sign up** and **log in** securely.
- Passwords are encrypted using **bcryptjs**.
- Logged-in users see their **username** in the top-right corner with a **logout** option.

### 2. File Management
- **Rename** a file.
- **Download** a file (to be implemented).
- **Save** a sheet to the database.
- **Clear** a sheet.
- **Switch between saved sheets** (to be implemented).

### 3. Spreadsheet Functionalities
- **Basic Mathematical Functions**:
  - SUM
  - MIN
  - MAX
  - AVERAGE
- **Data Quality Tools (Accessible from Data Header)**:
  - TRIM
  - UPPER
  - LOWER
  - REMOVE DUPLICATES
  - FIND & REPLACE (opens a dialog box in the right corner)
  - PROPER
  - REMOVE SPACES
  - VALIDATE
  - EXTRACT (opens a dialog box in the right corner)
  - CONCATENATE
  - SPLIT (opens a dialog box in the right corner)

- **Undo functionality**.
- **Resize spreadsheet container** using drag functionality.
- **Resize rows and columns** by clicking and dragging.
- **Select entire rows or columns** by clicking row/column numbers.
- **Multi-select rows and columns** using Shift + Arrow or Shift + Click.
- **Right-click for contextual actions.**

### 4. UI/UX Enhancements
- **React-Toastify** for notifications.
- **Help dropdown** in the header with:
  - Terms & Conditions
  - Privacy Policies
- **Footer with an option to create a new sheet.**

## Pending Features
- Implement **file download**.
- Implement **switching between saved sheets**.

### Frontend
- **React**: For building the user interface
- **Material-UI**: UI component library for Google-like appearance
- **mathjs**: For formula calculations

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **MongoDB**: Database
- **Mongoose**: MongoDB object modeling
- **JWT**: For authentication

## Core Implementation Strategy

### Cell Dependency System
- Implement a directed graph to track cell dependencies
- When a cell is updated, trigger re-calculation of dependent cells

### Formula Evaluation
- Parse formulas using a custom parser
- Build an abstract syntax tree (AST) for complex formulas
- Evaluate formulas with proper order of operations

### Drag and Selection
- Implement mouse event handling for cell selection
- Support for single cell, range, and multi-range selection
- Custom hooks for drag operations

