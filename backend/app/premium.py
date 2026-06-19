def calculate_premium(risk):
    premium_table = {
        1: 10000,
        2: 12000,
        3: 14000,
        4: 17000,
        5: 21000,
        6: 26000,
        7: 32000,
        8: 40000
    }
    
    return premium_table.get(risk, 10000)
