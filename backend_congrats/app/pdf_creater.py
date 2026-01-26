import json
import os

from weasyprint import HTML


def __load_json_data(filename):
    with open(filename, 'r', encoding='utf-8') as file:
        return json.load(file)

def __format_date(date_str: str) -> str:
    months = {
        1: 'января',
        2: 'февраля',
        3: 'марта',
        4: 'апреля',
        5: 'мая',
        6: 'июня',
        7: 'июля',
        8: 'августа',
        9: 'сентября',
        10: 'октября',
        11: 'ноября',
        12: 'декабря'
    }
    
    try:
        day, month, year = map(int, date_str.split('.'))
        month_name = months[month]
        return f"{day} {month_name} {year} г."
    except (ValueError, KeyError) as e:
        raise ValueError(f"Некорректный формат даты: {date_str}") from e


STYLE_CSS = f"""
<style>
    * {{ -webkit-font-smoothing: antialiased; box-sizing: border-box; }}
    body {{
        font-family: 'Geologica', 
        sans-serif; font-size: 14px; 
        line-height: 12.2px; 
        margin: 496px 84px 308px 231px; /* Отступы для содержимого */
    }}
    @page {{
        size: 1191px 1684px;
        margin: 0;
        background-image: url("file://{os.path.abspath('background.png')}");
		background-position: center;
		background-repeat: no-repeat;
	}}
    .content {{
        padding-top: 20px;
        font-weight: 100;
        line-height: 1;
        height: 840px;
        display: flex;
        flex-direction: column;        /* располагаем элементы по вертикали */
        justify-content: space-between; /* равные промежутки между элементами */
       
    }}
    .receiver h1 {{
        font-size: 44px;
        color: #2d3a67;
        text-align: center;
    }}
    .receiver h1.surname {{
        font-size: 52px;
        font-weight: bold;
        margin-bottom: 0;
    }}
    .receiver h1.company_name {{
        font-size: 52px;
        font-weight: bold;
        margin-bottom: 0;
        margin-left: 138px;
        margin-right: 138px;
        overflow-wrap: break-word;   /* перенос длинных слов */
        word-break: keep-all;        /* не режем слова посередине (для русского — лучше) */
        width: 600px;
    }}
    .receiver {{
        margin-bottom: 0;
    }}

    .sender_container {{
        display: flex;
        justify-content: space-between;
    }}    

    .sender h1 {{
        font-size: 38px;
        color: #2d3a67;
        text-align: left;
    }}
    .sender h1.surname {{
        font-size: 42px;
        font-weight: bold;
    }}
    
    .sender h1.name {{
        margin-right: 30px;
    }}
    h4 {{
        color: #2d3a67;
        text-align: center;
        font-size: 22px;
        margin-bottom: 12px;
        padding-top: 19.9px;
        font-weight: 200;
    }}
    p {{
        font-size: 24px;
        line-height: 1.25;
        margin-bottom: 12px;
        font-weight: 300;
    }}
    .sender p {{
        font-size: 20px;
        color: #2d3a67;
        margin-right: 30px;
    }}
    .congratulations_text {{
        text-align: center;
  transform: scaleY(1.3);        /* Вытягиваем по вертикали на 30% */
  transform-origin: center;      /* Точка трансформации — центр */
    }}
    .sender {{
        text-align: left;
    }}
    .date {{
        color: #2d3a67;
        font-size: 20px;
        text-align: center;
        margin-top: 2px;
        font-weight: 400;
    }}
    .signature {{
        text-align: center;
        flex: 1; /* 🚀 Занимает ВСЁ свободное пространство */
    }}
    .signature img {{
        text-align: center;
        height: 160px;
    }}

    .surname-line {{
        display: flex;
        align-items: center;
        gap: 10px; /* небольшой отступ между фамилией и полосой (по желанию) */
        margin-bottom: 8px;
    }}

    .yellow-stripe {{
        flex: 1;
        height: 4px;
        background-color: #FFD700; 
        min-width: 30px; 
        align-self: center;
    }}
</style>
"""


def generate_html_report(data):
    images_paths = []
    if data["entityType"] == "individual":
        gender = "Уважаемый" if data["recipient"]["gender"] == "male" else "Уважаемая"
        receiver_html = f"""
            <h4>{gender}</h4>
            <div class="receiver">
                <h1 class="surname">{data["recipient"]["lastName"].upper()}</h1>
                <h1>{data["recipient"]["firstName"].upper()} {data["recipient"]["middleName"].upper()}!</h1>
            </div>
        """
    else:
         receiver_html = f"""
            <h4>Коллективу</h4>
            <div class="receiver">
                <h1 class="company_name">{data["recipient"]["companyName"].upper()}</h1>
            </div>       
         """
    html_content = f"""
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <title>Поздравительное письмо</title>
        <link href="https://fonts.googleapis.com/css2?family=Geologica:wght@100;200;300;400;500;600&display=swap" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet">
        <link href="https://cdnjs.cloudflare.com/ajax/libs/meyer-reset/2.0/reset.min.css" rel="stylesheet">
        {STYLE_CSS}
    </head>
    <body>
        <div class="content">
            <div class="receiver_full">
                {receiver_html}
            </div>
            <div class="congratulations_text">
                <p>От души поздравляем вас с профессиональным праздником!<br>
                Без вашего благородного труда невозможно представить<br>
                стабильную и сильную Россию.</p>
                <br>
                <p>Пусть каждый рабочий день приносит вам<br>
                уважение граждан нашей страны, стабильность и достаток.</p>
                <br>
                <p>Желаем вам поддержки, любви близких,<br>
                здоровья и уверенности в будущем.<br>
                С праздником! Спасибо за труд! ЛДПР — за тех,<br>
                кто работает. За сильную страну. За вас.<br></p>
            </div>
            <div class="sender_container">
                <div class="signature">
                <img src="{data['sender']['signature']}">
                    <div class="date">{__format_date(data['date'])}</div>
                </div>
                <div class="sender">
                    <div class="surname-line">
                        <h1 class="surname">{data['sender']['lastName'].upper()}</h1>
                        <div class="yellow-stripe"></div>
                    </div>
                    <h1 class="name">{data['sender']['firstName'].upper()} {data['sender']['middleName'].upper()}</h1>
                    <p>Председатель партии ЛДПР,<br>глава фракции ЛДПР в Государственной Думе<br>Федерального Собрания Российской Федерации<p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    return html_content, images_paths


def generate_pdf_report(json_data, output_filename, debug=False):
    html_content, images_paths = generate_html_report(json_data)

    try:
        HTML(string=html_content).write_pdf(output_filename)
        if debug:
            with open("debug.html", "w", encoding="utf-8") as f:
                f.write(html_content)
    finally:
        for image_path in images_paths:
            if os.path.exists(image_path):
                os.remove(image_path)

if __name__ == "__main__":
    input_file = "data_example.json"
    output_file = "example.pdf"

    json_data = __load_json_data(input_file)
    generate_pdf_report(json_data, output_file, True)


