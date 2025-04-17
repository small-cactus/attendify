import { supabase } from './supabaseClient';

/**
 * Utility to apply database migrations that add required columns
 * for the new UX flow.
 */
export const applyMigrations = async () => {
  try {
    console.log('Checking and applying migrations...');
    
    // Check if member_uuid column exists
    const { error: columnsError } = await supabase
      .from('members')
      .select('member_uuid')
      .limit(1);
    
    // Column doesn't exist, we need to add it
    if (columnsError && columnsError.message.includes('column "member_uuid" does not exist')) {
      console.log('Adding member_uuid column to members table...');
      
      // Execute raw SQL to add the column
      const { error: alterError } = await supabase.rpc('add_member_uuid_column');
      
      if (alterError) {
        console.error('Error adding member_uuid column:', alterError);
        
        // Create the stored procedure if it doesn't exist
        await supabase.rpc('create_add_member_uuid_procedure');
        
        // Try adding the column again
        await supabase.rpc('add_member_uuid_column');
      }
      
      console.log('Migration completed successfully!');
    } else {
      console.log('No migrations needed. Database schema is up to date.');
    }
  } catch (error) {
    console.error('Migration failed:', error);
  }
};

/**
 * Call this function when the app first loads to ensure the database 
 * has the required structure for the new features.
 */
export const setupDatabase = async () => {
  // Create stored procedure for adding member_uuid column
  const createProcedureSql = `
  CREATE OR REPLACE FUNCTION create_add_member_uuid_procedure() 
  RETURNS void 
  LANGUAGE plpgsql 
  SECURITY DEFINER 
  AS $$
  BEGIN
    -- Create the procedure that will add the column
    EXECUTE '
      CREATE OR REPLACE FUNCTION add_member_uuid_column() 
      RETURNS void 
      LANGUAGE plpgsql 
      SECURITY DEFINER 
      AS $proc$
      BEGIN
        -- Check if column exists
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = ''members'' AND column_name = ''member_uuid''
        ) THEN
          -- Add the column
          ALTER TABLE members ADD COLUMN member_uuid UUID;
          
          -- Update existing rows with random UUIDs
          UPDATE members 
          SET member_uuid = gen_random_uuid() 
          WHERE member_uuid IS NULL;
        END IF;
      END;
      $proc$;
    ';
  END;
  $$;
  `;

  try {
    // Create the procedure for adding the procedure (inception!)
    const { error: procError } = await supabase.rpc('create_add_member_uuid_procedure');
    
    if (procError) {
      // If the procedure doesn't exist, create it with raw SQL
      const { error } = await supabase
        .from('_migrations')
        .insert({ name: 'create_migration_procedures', sql: createProcedureSql });
        
      if (error && !error.message.includes('duplicate')) {
        console.error('Failed to create migration procedure:', error);
      }
    }
    
    // Apply the migrations
    await applyMigrations();
  } catch (error) {
    console.error('Database setup failed:', error);
  }
};

// Export functions to be used in the app's entry point 