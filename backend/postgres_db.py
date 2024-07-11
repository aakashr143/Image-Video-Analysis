import psycopg2


def connect_to_db():
    return psycopg2.connect(database="vectordb", host="127.0.0.1", user="admin", password="admin", port="5432")


if __name__ == "__main__":
    conn = connect_to_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM frames LIMIT 1")
    print(cursor.fetchall())

    # cursor.execute("SELECT version();")
    # print(cursor.fetchone())

    cursor.close()
    conn.close()
