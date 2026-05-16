import pg8000

# Database configuration
DB_NAME = 'project_akhir'
DB_USER = 'postgres'
DB_PASSWORD = '1230987465'
DB_HOST = 'localhost'

def test_db_connection():
    try:
        conn = pg8000.connect(
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST
        )
        cursor = conn.cursor()

        # Test query
        cursor.execute("""
            SELECT timestamp, co2_ppm as co2, co_ppm as co, lpg_ppm as lpg, h2s_ppm as h2s, area_pred as status
            FROM public.gas_log
            ORDER BY timestamp DESC
            LIMIT 1
        """)

        result = cursor.fetchone()
        if result:
            columns = [desc[0] for desc in cursor.description]
            data = dict(zip(columns, result))
            print("Database connection successful!")
            print("Latest data from database:")
            print(f"Timestamp: {data['timestamp']}")
            print(f"CO2: {data['co2']}")
            print(f"CO: {data['co']}")
            print(f"LPG: {data['lpg']}")
            print(f"H2S: {data['h2s']}")
            print(f"Status (area_pred): {data['status']}")
        else:
            print("No data found in database")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"Database connection failed: {e}")

if __name__ == '__main__':
    test_db_connection()