# MySQL Setup Instructions

## The Issue

Your MySQL server requires a password, but the backend is trying to connect without one. This causes "Request failed" errors.

## Solution

### Step 1: Find Your MySQL Password

If you don't remember your MySQL root password, you can:

1. **Check if you have it saved somewhere**
2. **Reset it** (see below)
3. **Use a different MySQL user** with a known password

### Step 2: Set the Password and Start Backend

Open a terminal and run:

```bash
# Set your MySQL password (replace 'yourpassword' with your actual password)
export DB_PASSWORD=yourpassword

# Navigate to backend directory
cd /Users/kerolosasaad/Desktop/KIROLLOUS/backend

# Start the backend
npm start
```

### Step 3: Make it Permanent (Optional)

Add the password to your shell profile so you don't have to set it every time:

```bash
# For zsh (default on macOS)
echo 'export DB_PASSWORD=yourpassword' >> ~/.zshrc
source ~/.zshrc

# For bash
echo 'export DB_PASSWORD=yourpassword' >> ~/.bash_profile
source ~/.bash_profile
```

## Alternative: Reset MySQL Password

If you don't know your MySQL password, you can reset it:

### On macOS:

1. **Stop MySQL:**
   ```bash
   brew services stop mysql
   ```

2. **Start MySQL in safe mode:**
   ```bash
   mysqld_safe --skip-grant-tables &
   ```

3. **Connect without password:**
   ```bash
   mysql -u root
   ```

4. **Reset password:**
   ```sql
   USE mysql;
   UPDATE user SET authentication_string=PASSWORD('newpassword') WHERE User='root';
   FLUSH PRIVILEGES;
   EXIT;
   ```

5. **Restart MySQL normally:**
   ```bash
   brew services start mysql
   ```

6. **Test the new password:**
   ```bash
   mysql -u root -p
   # Enter: newpassword
   ```

## Quick Test

After setting the password, test the connection:

```bash
# Test MySQL connection
mysql -u root -p -e "SELECT 1"
# Enter your password when prompted

# Test backend connection
export DB_PASSWORD=yourpassword
cd backend
npm start
```

You should see: "Connected to MySQL" in the terminal.

## If You Don't Want a Password

If you want to remove the MySQL password requirement (less secure):

1. Connect to MySQL as root
2. Run: `ALTER USER 'root'@'localhost' IDENTIFIED BY '';`
3. Then the backend will work without DB_PASSWORD

