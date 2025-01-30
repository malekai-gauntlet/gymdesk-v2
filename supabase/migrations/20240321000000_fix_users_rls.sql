-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy for inserting new users (only authenticated users can insert their own record)
DROP POLICY IF EXISTS "Users can insert their own record" ON users;
CREATE POLICY "Users can insert their own record" ON users
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Policy for selecting users (authenticated users can read all users)
DROP POLICY IF EXISTS "Authenticated users can view all users" ON users;
CREATE POLICY "Authenticated users can view all users" ON users
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policy for updating users (users can only update their own record)
DROP POLICY IF EXISTS "Users can update own record" ON users;
CREATE POLICY "Users can update own record" ON users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy for deleting users (only admin can delete)
DROP POLICY IF EXISTS "Only admin can delete users" ON users;
CREATE POLICY "Only admin can delete users" ON users
    FOR DELETE
    USING (auth.role() = 'authenticated' AND EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )); 