-- Enable RLS on tickets table
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Policy for members to create tickets
CREATE POLICY "Members can create tickets" ON tickets
    FOR INSERT 
    WITH CHECK (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'member'
        )
    );

-- Policy for members to view their own tickets
CREATE POLICY "Members can view own tickets" ON tickets
    FOR SELECT
    USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'agent')
        )
    );

-- Policy for members to update their own tickets
CREATE POLICY "Members can update own tickets" ON tickets
    FOR UPDATE
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- Policy for staff to manage all tickets
CREATE POLICY "Staff can manage all tickets" ON tickets
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'agent')
        )
    ); 