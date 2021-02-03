const yc = require('yandex-cloud');
const fetch = require('node-fetch');
const serverless = require('serverless-http')
const app = require('express')()
const bodyParser = require('body-parser')
const https = require('https');

var YANDEX_DATABASE_ENDPOINT = '***********************';

// ! Тестовая база данных
// var YANDEX_DATABASE_PATH = 'vk-bot-test/users';
// ! Основная база данных
var YANDEX_DATABASE_PATH = '*********************';
var YANDEX_CLOUD_IAMTOKEN = '';

var YANDEX_CLOUD_FUNCTION_IAMTOKEN_LINK = '**********************';

var done = false;

// ! Токен Standalone приложения "Чат бот" (для получения записей со стены сообщества)
const serviceToken = '*********************';

// ! id группы (для получения записей со стены сообщества)
// const groupId = '-201830132';
const groupId = '-185007106';
// ! url группы (для получения записей со стены сообщества)
// const groupUrl = 'https://vk.com/econom_app';
const groupUrl = 'https://vk.com/econom54';

// ! Количество последних дней, за которые индексировать категории товаров
// ! Это число должно быть больше, чем кол-во дней прошедших с момента публикации первой записи на стене
// const lastDays = 1;
const lastDays = 7;

const VkBot = require('node-vk-bot-api'),
    Markup = require('node-vk-bot-api/lib/markup'),
    Scene = require('node-vk-bot-api/lib/scene'),
    Session = require('node-vk-bot-api/lib/session'),
    Stage = require('node-vk-bot-api/lib/stage'),
    bot = new VkBot({
        // ! Тестовый токен
        // token: '******************',
        // ! Токен основной группы
        token: '************',
        secret: '**********',
        confirmation: '*********'
    });

app.use(bodyParser.json());
app.post('/', bot.webhookCallback);



// Серверное приложение
const handler = serverless(app);

// Главная функция
module.exports.handlerr = async (event, context) => {

    // Получаем IAM токен
    YANDEX_CLOUD_IAMTOKEN = context['token']['access_token'];

    var timeStart = Date.now();

    if (event.queryStringParameters['custom_nitify_message'] != null) {
        if (event.queryStringParameters['custom_nitify_message'] == 'true') {
            var messageText = event.queryStringParameters['message_text'];
            var buttonLink = event.queryStringParameters['button_link'];
            var buttonText = event.queryStringParameters['button_text'];
            await sendCustomNotifyMessage(messageText, buttonLink, buttonText);
            return {
                statusCode: 200,
                body: 'ok',
            };
        }
    }

    // console.log(event)
    // you can do other things here
    const result = await handler(event, context);
    // and here
    // console.log(result)


    // while (true) {
    //     if (done) break;
    // }

    var timeEnd = Date.now();
    var timeExec = timeEnd - timeStart;
    console.log('Время выполнения функции: ' + timeExec.toString() + ' мс');



    // return result;
    return {
        statusCode: 200,
        body: 'ok',
    };
};

// // Обработчик сообщений
// bot.command('привет', (ctx) => {
//   ctx.reply('Ку');  
// });

// Обработчик редактирования сообщений
// bot.event('message_edit', (ctx) => {
//   // ctx.reply('Your message was editted');
// });

// // Обработчик кнопок обратного вызова
// bot.event('message_event', (ctx) => {
//     console.log(ctx);
//     // ctx.reply('Была нажата кнопка обратного вызова');
//     bot.execute('messages.sendMessageEventAnswer', {
//         // user_id: ctx.message.user_id,
//         // peer_id: ctx.message.peer_id,
//         user_id: 564272600,
//         peer_id: 564272600,
//         event_id: 'randoddm_id',
//         event_data: {
//             type: "show_snackbar",
//             text: "Покажи исчезающее сообщение на экране",
//         },
//     });
// });


// ? // 'Начать'
bot.command('Начать', async (ctx) => {
    var groupFlag = false;
    var appFlag = false;
    // Попытаться получить пользователя из бд:
    var res = await getElementByUniqueKeyVkId(ctx.message.from_id.toString());
    // console.log(res);
    // Если пользователя нет в бд
    if (res == null) {
        // Создать пользователя в бд и добавить ему время регистрации в боте
        await addElementByUniqueKeyVkId(ctx.message.from_id.toString());
        await updateParamByUniqueKeyVkId(ctx.message.from_id.toString(), 'join_date_time', Date(Date.now()).toString());
        // По усолчанию при регистрации уведомления отключены
        await updateParamByUniqueKeyVkId(ctx.message.from_id.toString(), 'group_flag', 'false');
        await updateParamByUniqueKeyVkId(ctx.message.from_id.toString(), 'app_flag', 'false');
    } else {
        // Получить данные об уведомлениях в приложении
        if (res.group_flag.S == 'false') {
            groupFlag = false;
        } else {
            groupFlag = true;
        }
        if (res.app_flag.S == 'false') {
            appFlag = false;
        } else {
            appFlag = true;
        }
    }

    // Показать пользователю сообщение
    message2('Это чат-бот', ctx, groupFlag, appFlag);
    done = true;
});

// ? // 'Start'
bot.command('Start', async (ctx) => {
    var groupFlag = false;
    var appFlag = false;
    // Попытаться получить пользователя из бд:
    var res = await getElementByUniqueKeyVkId(ctx.message.from_id.toString());
    // console.log(res);
    // Если пользователя нет в бд
    if (res == null) {
        // Создать пользователя в бд и добавить ему время регистрации в боте
        await addElementByUniqueKeyVkId(ctx.message.from_id.toString());
        await updateParamByUniqueKeyVkId(ctx.message.from_id.toString(), 'join_date_time', Date(Date.now()).toString());
        // По усолчанию при регистрации уведомления отключены
        await updateParamByUniqueKeyVkId(ctx.message.from_id.toString(), 'group_flag', 'false');
        await updateParamByUniqueKeyVkId(ctx.message.from_id.toString(), 'app_flag', 'false');
    } else {
        // Получить данные об уведомлениях в приложении
        if (res.group_flag.S == 'false') {
            groupFlag = false;
        } else {
            groupFlag = true;
        }
        if (res.app_flag.S == 'false') {
            appFlag = false;
        } else {
            appFlag = true;
        }
    }

    // Показать пользователю сообщение
    message2('Это чат-бот', ctx, groupFlag, appFlag);
    done = true;
});

// ? // 'Записи в группе (отключить)'
bot.command('Записи в группе (отключить)', async (ctx) => {
    // Попытаться получить пользователя из бд:
    var res = await getElementByUniqueKeyVkId(ctx.message.from_id.toString());
    // console.log(res);
    // Если пользователя нет в бд
    if (res == null) {
        // Создать пользователя в бд и добавить ему время регистрации в боте
        await addElementByUniqueKeyVkId(ctx.message.from_id.toString());
        await updateParamByUniqueKeyVkId(ctx.message.from_id.toString(), 'join_date_time', Date(Date.now()).toString());
        // По усолчанию при регистрации уведомления отключены
        await updateParamByUniqueKeyVkId(ctx.message.from_id.toString(), 'group_flag', 'false');
        await updateParamByUniqueKeyVkId(ctx.message.from_id.toString(), 'app_flag', 'false');
        // Показать пользователю сообщение
        message2('Вы отписались от записей в группе', ctx, false, false);
    } else {
        // Если пользователь есть в базе данных
        // Отключить уведомления в группе:
        await updateParamByUniqueKeyVkId(ctx.message.from_id.toString(), 'group_flag', 'false');
        // Получить данные об уведомлениях в приложении
        var appFlag = false;
        if (res.app_flag.S == 'false') {
            appFlag = false;
        } else {
            appFlag = true;
        }
        message2('Вы отписались от записей в группе', ctx, false, appFlag);
    }
});

// ? // 'Записи в группе (включить)'
bot.command('Записи в группе (включить)', async (ctx) => {
    // Попытаться получить пользователя из бд:
    var res = await getElementByUniqueKeyVkId(ctx.message.from_id.toString());
    // console.log(res);
    // Если пользователя нет в бд
    if (res == null) {
        // Создать пользователя в бд и добавить ему время регистрации в боте
        await addElementByUniqueKeyVkId(ctx.message.from_id.toString());
        await updateParamByUniqueKeyVkId(ctx.message.from_id.toString(), 'join_date_time', Date(Date.now()).toString());
        // По усолчанию при регистрации уведомления отключены
        await updateParamByUniqueKeyVkId(ctx.message.from_id.toString(), 'group_flag', 'true');
        await updateParamByUniqueKeyVkId(ctx.message.from_id.toString(), 'app_flag', 'false');
        // Показать пользователю сообщение
        message2('Вы подписались на записи в группе', ctx, true, false);
    } else {
        // Если пользователь есть в базе данных
        // Отключить уведомления в группе:
        await updateParamByUniqueKeyVkId(ctx.message.from_id.toString(), 'group_flag', 'true');
        // Получить данные об уведомлениях в приложении
        var appFlag = false;
        if (res.app_flag.S == 'false') {
            appFlag = false;
        } else {
            appFlag = true;
        }
        message2('Вы подписались на записи в группе', ctx, true, appFlag);
    }
});

// ? // 'Новинки в приложении (отключить)'
bot.command('Новинки в приложении (отключить)', async (ctx) => {
    // Попытаться получить пользователя из бд:
    var res = await getElementByUniqueKeyVkId(ctx.message.from_id.toString());
    // console.log(res);
    // Если пользователя нет в бд
    if (res == null) {
        // Создать пользователя в бд и добавить ему время регистрации в боте
        await addElementByUniqueKeyVkId(ctx.message.from_id.toString());
        await updateParamByUniqueKeyVkId(ctx.message.from_id.toString(), 'join_date_time', Date(Date.now()).toString());
        // По усолчанию при регистрации уведомления отключены
        await updateParamByUniqueKeyVkId(ctx.message.from_id.toString(), 'group_flag', 'false');
        await updateParamByUniqueKeyVkId(ctx.message.from_id.toString(), 'app_flag', 'false');
        // Показать пользователю сообщение
        message2('Вы отписались от новинок в приложении', ctx, false, false);
    } else {
        // Если пользователь есть в базе данных
        // Отключить уведомления в группе:
        await updateParamByUniqueKeyVkId(ctx.message.from_id.toString(), 'app_flag', 'false');
        // Получить данные об уведомлениях в приложении
        var groupFlag = false;
        if (res.group_flag.S == 'false') {
            groupFlag = false;
        } else {
            groupFlag = true;
        }
        message2('Вы отписались от новинок в приложении', ctx, groupFlag, false);
    }
});

// ? // 'Новинки в приложении (включить)'
bot.command('Новинки в приложении (включить)', async (ctx) => {
    // Попытаться получить пользователя из бд:
    var res = await getElementByUniqueKeyVkId(ctx.message.from_id.toString());
    // console.log(res);
    // Если пользователя нет в бд
    if (res == null) {
        // Создать пользователя в бд и добавить ему время регистрации в боте
        await addElementByUniqueKeyVkId(ctx.message.from_id.toString());
        await updateParamByUniqueKeyVkId(ctx.message.from_id.toString(), 'join_date_time', Date(Date.now()).toString());
        // По усолчанию при регистрации уведомления отключены
        await updateParamByUniqueKeyVkId(ctx.message.from_id.toString(), 'group_flag', 'false');
        await updateParamByUniqueKeyVkId(ctx.message.from_id.toString(), 'app_flag', 'true');
        // Показать пользователю сообщение
        message2('Вы подписались на новинки в приложении', ctx, false, true);
    } else {
        // Если пользователь есть в базе данных
        // Отключить уведомления в группе:
        await updateParamByUniqueKeyVkId(ctx.message.from_id.toString(), 'app_flag', 'true');
        // Получить данные об уведомлениях в приложении
        var groupFlag = false;
        if (res.group_flag.S == 'false') {
            groupFlag = false;
        } else {
            groupFlag = true;
        }
        message2('Вы подписались на новинки в приложении', ctx, groupFlag, true);
    }
});

// ? // 'Заработать 💰'
bot.command('Заработать 💰', async (ctx) => {
    // Попытаться получить пользователя из бд:
    var res = await getElementByUniqueKeyVkId(ctx.message.from_id.toString());
    // console.log(res);
    // Если пользователя нет в бд
    if (res == null) {
        // Создать пользователя в бд и добавить ему время регистрации в боте
        await addElementByUniqueKeyVkId(ctx.message.from_id.toString());
        await updateParamByUniqueKeyVkId(ctx.message.from_id.toString(), 'join_date_time', Date(Date.now()).toString());
        // По усолчанию при регистрации уведомления отключены
        await updateParamByUniqueKeyVkId(ctx.message.from_id.toString(), 'group_flag', 'false');
        await updateParamByUniqueKeyVkId(ctx.message.from_id.toString(), 'app_flag', 'false');
        // Показать пользователю сообщение
        // await bot.sendMessage(ctx.message.user_id, 'Эй, бро, ты куда?');
        message2('Получай денежные вознаграждения за пост. От 100 до 200 рублей! Подробности:  https://vk.com/topic-185007106_46817233 ', ctx, false, false);
    } else {

        // Получить данные об уведомлениях в приложении
        var groupFlag = false;
        if (res.group_flag.S == 'false') {
            groupFlag = false;
        } else {
            groupFlag = true;
        }
        var appFlag = false;
        if (res.app_flag.S == 'false') {
            appFlag = false;
        } else {
            appFlag = true;
        }
        // await bot.sendMessage(ctx.message.user_id, 'Эй, бро, ты куда?');
        message2('Получай денежные вознаграждения за пост. От 100 до 200 рублей! Подробности:  https://vk.com/topic-185007106_46817233 ', ctx, groupFlag, appFlag);
    }
    done = true;
});

// ? // 'Категории'
bot.command('Категории', async (ctx) => {
    var groupFlag = false;
    var appFlag = false;
    // Попытаться получить пользователя из бд:
    var res = await getElementByUniqueKeyVkId(ctx.message.from_id.toString());
    // console.log(res);
    // Если пользователя нет в бд
    if (res == null) {
        // Создать пользователя в бд и добавить ему время регистрации в боте
        await addElementByUniqueKeyVkId(ctx.message.from_id.toString());
        await updateParamByUniqueKeyVkId(ctx.message.from_id.toString(), 'join_date_time', Date(Date.now()).toString());
        // По усолчанию при регистрации уведомления отключены
        await updateParamByUniqueKeyVkId(ctx.message.from_id.toString(), 'group_flag', 'false');
        await updateParamByUniqueKeyVkId(ctx.message.from_id.toString(), 'app_flag', 'false');
    } else {
        // Получить данные об уведомлениях в приложении
        if (res.group_flag.S == 'false') {
            groupFlag = false;
        } else {
            groupFlag = true;
        }
        if (res.app_flag.S == 'false') {
            appFlag = false;
        } else {
            appFlag = true;
        }
    }

    // 1. Получить все записи из группы за последнюю неделю
    // 2. Отфильтровать только по типу post
    // 3. Рассортировать по категориям
    // 4. Из списка категорий сделать кнопки

    // Результирующий список нужных записей
    var allPostsForLastWeek = [];
    var finalAllPostsForLastWeek = [];

    // Временной интервал в миллисекундах, за который надо получить промоакции
    var intervalTime = 86400 * 1000 * lastDays;

    // В бесконечном цикле
    while (true) {
        // Делаем запрос
        let methodName = 'wall.get';
        const vkApi = `https://api.vk.com/method/${methodName}?access_token=${serviceToken}&v=5.103`;
        try {
            // ! Получение записей со стены из основной группы
            // var response = await fetch(`${vkApi}&owner_id=-185007106&count=100&domain=https://vk.com/econom54`);
            // ! Получение записей со стены из тестовой группы
            var response = await fetch(`${vkApi}&owner_id=${groupId}&count=100&domain=${groupUrl}`);
        } catch (e) {
            console.log(e);
        }
        const data = await response.json();

        // Добавляем данные в результирующий список
        data.response.items.forEach(function (value) {
            allPostsForLastWeek.push(value);
        });

        var now = Date.now();
        var datePost = parseInt(allPostsForLastWeek[allPostsForLastWeek.length - 1].date * 1000);
        // Если дата последней записи в списке превышает заданный интервал, то выходим из цикла

        // console.log(parseInt(data.response.count));
        // console.log(allPostsForLastWeek.length);

        // Случай, когда интервал больше, чем время публикации первой записи на стене
        // if (parseInt(data.response.count) <= allPostsForLastWeek.length) break; // не корректно работает
        if ((now - datePost) > intervalTime) break;

    }


    // Из результирующего списка удалить все записи старше указанного интервала
    allPostsForLastWeek = allPostsForLastWeek.filter(item => !(now - (parseInt(item.date) * 1000) > intervalTime));

    allPostsForLastWeek.forEach(function (e) {
        // Первая строка текста записи:
        var firstStr = e.text.split('\n')[0];

        // Если в первой строке не два слова, то пропустить эту запись
        if (firstStr.split(' ').length != 2) return;

        // Первое слово первой строки текста записи:
        var firstSymbol = firstStr.split(' ')[0];

        // Регулярное выражение эмодзи:
        // const regex2 = new RegExp('(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe23\u20d0-\u20f0]|\ud83c[\udffb-\udfff])?(?:\u200d(?:[^\ud800-\udfff]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe23\u20d0-\u20f0]|\ud83c[\udffb-\udfff])?)*');

        // Если первое слово содержит ровно один эмодзи
        if (firstSymbol.match(/(\p{Emoji_Presentation}|\p{Extended_Pictographic}|\p{Emoji})/gu) != null && firstSymbol.match(/(\p{Emoji_Presentation}|\p{Extended_Pictographic}|\p{Emoji})/gu).length == 1) {
            // Добавить запись в финальный список
            finalAllPostsForLastWeek.push(e);
        }
    });

    // Финальный список значений названий категорий
    var uniqueFinalList = [];
    finalAllPostsForLastWeek.forEach(function (e) {
        uniqueFinalList.push(e.text.split('\n')[0].split(' ')[1])
    });

    // Убрать из списка повторяющиеся значения
    uniqueFinalList = [...new Set(uniqueFinalList)];

    // test
    // console.log(uniqueFinalList);

    // Разбить список категорий по 10 штук (т к к одному сообщению можно прекрепить максимум 10 кнопок)
    var chunksForShowUserButton = [];
    chunksForShowUserButton = chunkArray(uniqueFinalList, 10);
    // test
    // console.log(chunksForShowUserButton);

    // Список клавиатур для сообщений:
    var listKeyboards = [];

    // Заполнить список клавиатур
    chunksForShowUserButton.forEach(function (e) {
        var listButtons = [];
        e.forEach(function (ee) {
            listButtons.push(
                Markup.button({
                    action: {
                        type: 'text',
                        label: ee,
                        payload: JSON.stringify({
                            product_category: '' + ee,
                        }),
                    },
                }));
        });
        // Разбить список кнопок по две кнопки в ряд
        listButtons = chunkArray(listButtons, 2);
        // Добавить клавиуатуру в список клавиатур 
        listKeyboards.push(listButtons);
    });

    // test
    // console.log(listKeyboards);

    // В цикле пройтись по списку клавиатур и отправить их пользователю
    for (var i = 0; i < listKeyboards.length; i++) {
        await bot.sendMessage(ctx.message.from_id, i == 0 ? 'Категории промо-акций за последние ' + lastDays + ' дней:' : 'Ещё:', null,
            Markup
                .keyboard(listKeyboards[i]).inline(),
        );
    }
    ///////////////////

    // var keyboard = [
    //     [
    //         Markup.button({
    //             action: {
    //                 type: 'text',
    //                 label: 'Категория 1',
    //                 payload: JSON.stringify({
    //                     product_category: '- Категория 1',
    //                 }),
    //             },
    //         }),
    //         Markup.button({
    //             action: {
    //                 type: 'text',
    //                 label: 'Категория 2',
    //                 payload: JSON.stringify({
    //                     product_category: '- Категория 2',
    //                 }),
    //             },
    //         }),
    //     ],
    //     [
    //         Markup.button({
    //             action: {
    //                 type: 'text',
    //                 label: 'Категория 3',
    //                 payload: JSON.stringify({
    //                     url: '- Категория 3',
    //                 }),
    //             },
    //         }),
    //         Markup.button({
    //             action: {
    //                 type: 'text',
    //                 label: 'Категория 4',
    //                 payload: JSON.stringify({
    //                     product_category: '- Категория 4',
    //                 }),
    //             },
    //         }),
    //     ],
    //     [
    //         Markup.button({
    //             action: {
    //                 type: 'text',
    //                 label: 'Категория 5',
    //                 payload: JSON.stringify({
    //                     product_category: '- Категория 5',
    //                 }),
    //             },
    //         }),
    //         Markup.button({
    //             action: {
    //                 type: 'text',
    //                 label: 'Категория 6',
    //                 payload: JSON.stringify({
    //                     product_category: '- Категория 6',
    //                 }),
    //             },
    //         }),
    //     ],
    //     [
    //         Markup.button({
    //             action: {
    //                 type: 'text',
    //                 label: 'Категория 7',
    //                 payload: JSON.stringify({
    //                     product_category: '- Категория 7',
    //                 }),
    //             },
    //         }),
    //         Markup.button({
    //             action: {
    //                 type: 'text',
    //                 label: 'Категория 8',
    //                 payload: JSON.stringify({
    //                     product_category: '- Категория 8',
    //                 }),
    //             },
    //         }),
    //     ],
    //     [
    //         Markup.button({
    //             action: {
    //                 type: 'text',
    //                 label: 'Категория 9',
    //                 payload: JSON.stringify({
    //                     product_category: '- Категория 9',
    //                 }),
    //             },
    //         }),
    //         Markup.button({
    //             action: {
    //                 type: 'text',
    //                 label: 'Категория 10',
    //                 payload: JSON.stringify({
    //                     product_category: '- Категория 10',
    //                 }),
    //             },
    //         }),
    //     ],
    // ];
    // Отправить пользователю сообщение с кнопками

    // await bot.sendMessage(ctx.message.from_id, 'Категории:', null,
    //     Markup
    //         .keyboard(keyboard).inline(),
    // );
    // await bot.sendMessage(ctx.message.from_id, 'Ещё:', null,
    //     Markup
    //         .keyboard(keyboard).inline(),
    // );
    // await bot.sendMessage(ctx.message.from_id, 'Ещё:', null,
    //     Markup
    //         .keyboard(keyboard).inline(),
    // );

    // Показать пользователю сообщение
    // message2('Это категории', ctx, groupFlag, appFlag);
    done = true;
});

// ? // 'Информация'
bot.command('Информация', async (ctx) => {
    var groupFlag = false;
    var appFlag = false;
    // Попытаться получить пользователя из бд:
    var res = await getElementByUniqueKeyVkId(ctx.message.from_id.toString());
    // console.log(res);
    // Если пользователя нет в бд
    if (res == null) {
        // Создать пользователя в бд и добавить ему время регистрации в боте
        await addElementByUniqueKeyVkId(ctx.message.from_id.toString());
        await updateParamByUniqueKeyVkId(ctx.message.from_id.toString(), 'join_date_time', Date(Date.now()).toString());
        // По усолчанию при регистрации уведомления отключены
        await updateParamByUniqueKeyVkId(ctx.message.from_id.toString(), 'group_flag', 'false');
        await updateParamByUniqueKeyVkId(ctx.message.from_id.toString(), 'app_flag', 'false');
    } else {
        // Получить данные об уведомлениях в приложении
        if (res.group_flag.S == 'false') {
            groupFlag = false;
        } else {
            groupFlag = true;
        }
        if (res.app_flag.S == 'false') {
            appFlag = false;
        } else {
            appFlag = true;
        }
    }

    // Показать пользователю сообщение
    message1(ctx, groupFlag, appFlag);
    done = true;
});


// ! Слушатель всех остальных сообщений
// ? Слушатель нажатия клавиш с категориями
// ? Отправляет пользователю со списком записей со стены с выбранной категорией
bot.event('message_new', async (ctx) => {
    var groupFlag = false;
    var appFlag = false;
    // Попытаться получить пользователя из бд:
    var res = await getElementByUniqueKeyVkId(ctx.message.from_id.toString());
    // console.log(res);
    // Если пользователя нет в бд
    if (res == null) {
        // Создать пользователя в бд и добавить ему время регистрации в боте
        await addElementByUniqueKeyVkId(ctx.message.from_id.toString());
        await updateParamByUniqueKeyVkId(ctx.message.from_id.toString(), 'join_date_time', Date(Date.now()).toString());
        // По усолчанию при регистрации уведомления отключены
        await updateParamByUniqueKeyVkId(ctx.message.from_id.toString(), 'group_flag', 'false');
        await updateParamByUniqueKeyVkId(ctx.message.from_id.toString(), 'app_flag', 'false');
    } else {
        // Если пользователь есть в базе данных

        if (res.group_flag.S == 'false') {
            groupFlag = false;
        } else {
            groupFlag = true;
        }
        if (res.app_flag.S == 'false') {
            appFlag = false;
        } else {
            appFlag = true;
        }
    }

    if (ctx.message.payload != null) {
        var payload = JSON.parse(ctx.message.payload);
        // Сообщение с коллбэком
        if (payload['product_category'] != null) {

            // 1. Получить все записи из группы за последнюю неделю
            // 2. Отфильтровать только по типу post
            // 3. Рассортировать по категориям
            // 4. Отправить пользователю в сообщении список постов нужных категорий


            // Результирующий список нужных записей
            var allPostsForLastWeek = [];
            var finalAllPostsForLastWeek = [];

            // Временной интервал в миллисекундах, за который надо получить промоакции
            var intervalTime = 86400 * 1000 * lastDays;

            // В бесконечном цикле
            while (true) {
                // Делаем запрос
                let methodName = 'wall.get';
                const vkApi = `https://api.vk.com/method/${methodName}?access_token=${serviceToken}&v=5.103`;
                try {
                    // ! Получение записей со стены из основной группы
                    // var response = await fetch(`${vkApi}&owner_id=-185007106&count=100&domain=https://vk.com/econom54`);
                    // ! Получение записей со стены из тестовой группы
                    var response = await fetch(`${vkApi}&owner_id=${groupId}&count=100&domain=${groupUrl}`);
                } catch (e) {
                    console.log(e);
                }
                const data = await response.json();

                // Добавляем данные в результирующий список
                data.response.items.forEach(function (value) {
                    allPostsForLastWeek.push(value);
                });

                var now = Date.now();
                var datePost = parseInt(allPostsForLastWeek[allPostsForLastWeek.length - 1].date * 1000);
                // Случай, когда интервал больше, чем время публикации первой записи на стене
                // if (parseInt(data.response.count) <= allPostsForLastWeek.length) break; // не корректно работает
                // Если дата последней записи в списке превышает заданный интервал, то выходим из цикла
                if ((now - datePost) > intervalTime) break;
            }


            // Из результирующего списка удалить все записи старше указанного интервала
            allPostsForLastWeek = allPostsForLastWeek.filter(item => !(now - (parseInt(item.date) * 1000) > intervalTime));

            allPostsForLastWeek.forEach(function (e) {
                // Первая строка текста записи:
                var firstStr = e.text.split('\n')[0];

                // Если в первой строке не два слова, то пропустить эту запись
                if (firstStr.split(' ').length != 2) return;

                // Первое слово первой строки текста записи:
                var firstSymbol = firstStr.split(' ')[0];

                // Регулярное выражение эмодзи:
                // const regex2 = new RegExp('(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe23\u20d0-\u20f0]|\ud83c[\udffb-\udfff])?(?:\u200d(?:[^\ud800-\udfff]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe23\u20d0-\u20f0]|\ud83c[\udffb-\udfff])?)*');

                // Если первое слово содержит ровно один эмодзи
                if (firstSymbol.match(/(\p{Emoji_Presentation}|\p{Extended_Pictographic}|\p{Emoji})/gu) != null && firstSymbol.match(/(\p{Emoji_Presentation}|\p{Extended_Pictographic}|\p{Emoji})/gu).length == 1) {
                    // Добавить запись в финальный список
                    finalAllPostsForLastWeek.push(e);
                }
            });

            // Сообщение со списоком ссылок на записи с выбранной категорией
            var messageForUser = 'Найденные записи:\n';

            var actualType = false;

            // Пройтись по списку записей
            finalAllPostsForLastWeek.forEach(function (e) {
                // Если тип продукта очередной записи равен выбранному пользователем типу
                if (e.text.split('\n')[0].split(' ')[1] == payload['product_category']) {
                    // Сформировать ссылку на пост:
                    var linkPost = 'https://vk.com/wall-';
                    linkPost += (e.owner_id * -1).toString() + '_' + e.id.toString();
                    messageForUser += '✅' + linkPost + '\n';
                    // console.log(e);
                    actualType = true;
                }
            });

            // Если вдруг пользователь выбрал категорию слишком поздно, и записи по этой категории более не доступны
            if (!actualType) {
                messageForUser = 'По данной категории акций за последнюю неделю не найдено. Посмотрите новые категории:\n'
            }
            // console.log(finalAllPostsForLastWeek);

            // Отправить пользователю сообщение со списоком ссылок на записи с выбранной категорией
            // message2(messageForUser, ctx, groupFlag, appFlag);
            await bot.sendMessage(ctx.message.from_id, messageForUser, null, Markup
                .keyboard([
                    // И кнопка "Категории"
                    Markup.button({
                        action: {
                            type: 'text',
                            label: 'Категории',
                            // payload: JSON.stringify({
                            //     url: linkPost,
                            // }),
                        },
                    }),
                ]).inline(),
            );
            return;
        }
    }


    // Показать пользователю сообщение
    message2('Неизвестная команда', ctx, groupFlag, appFlag);
});


// ? Слушатель публикации новых записей на стене
// ? Отправляет пользователям уведомление в лс о новой записи в группе
bot.event('wall_post_new', async (ctx) => {
    // ! Костыль (отправлять пользователям только финально опубликованные посты)
    if (ctx.message.post_type != 'post') {
        done = true;
        return;
    }

    // Если в начале текста записи стоит точка, то не отправлять пост
    if (ctx.message.text != null && ctx.message.text[0] == '.') {
        done = true;
        return;
    }

    // Сформировать ссылку на пост:
    var linkPost = 'https://vk.com/wall-';
    linkPost += (ctx.message.owner_id * -1).toString() + '_' + ctx.message.id.toString();

    // Костыльная проверка первого символа сообщения
    // Сделать отбор постов по какому-нибудь свойству
    // if (ctx.message.text[0] != '-') return;

    // 1. Получить из бд список всех юзеров
    var allUsers = await getAllUsers();

    // 2. Отфильтровать по флагу group_flag
    // Целевой список юзеров, которым нобходимо отправить сообщение
    var allTargetUsers = [];
    allUsers.forEach(function (e) {
        if (e['group_flag'] != null && e['group_flag']['S'] != null) {
            // Если у юзера есть подписка на новые записи в группе
            if (e['group_flag']['S'] == 'true') {
                // Добавить его в целевой список юзеров
                allTargetUsers.push(e['unique_key_vk_id']['S']);
            }
        }
    });
    // 3. Разбить на партии по 100 юзеров
    var chunks = chunkArray(allTargetUsers, 100);

    // 4. В цикле отправлять по 100 сообщений за раз.
    if (chunks.length > 0) {
        for (var i = 0; i < chunks.length; i++) {
            // Пользователю отправляется текст новой записи
            await bot.sendMessage(chunks[i], ctx.message.text, null, Markup
                .keyboard([
                    // И кнопка "Открыть запись"
                    Markup.button({
                        action: {
                            type: 'open_link',
                            link: linkPost,
                            label: 'Открыть запись',
                            payload: JSON.stringify({
                                url: linkPost,
                            }),
                        },
                    }),
                ]).inline(),
            );
        }
    }
    // test
    // Тестовый вывод контрольного списка id пользователей, которым нужно отправить сообщение
    // console.log(chunks);
    done = true;
});

// ? Слушатель покидания пользователями группы
// ? Отправляет пользователям уведомление в лс о "Эээ..., ты куда?"
bot.event('group_leave', async (ctx) => {
    // console.log(ctx);
    // Попытаться получить пользователя из бд:
    var res = await getElementByUniqueKeyVkId(ctx.message.user_id.toString());
    // console.log(res);
    // Если пользователя нет в бд
    if (res == null) {
        // Создать пользователя в бд и добавить ему время регистрации в боте
        await addElementByUniqueKeyVkId(ctx.message.user_id.toString());
        await updateParamByUniqueKeyVkId(ctx.message.user_id.toString(), 'join_date_time', Date(Date.now()).toString());
        // По усолчанию при регистрации уведомления отключены
        await updateParamByUniqueKeyVkId(ctx.message.user_id.toString(), 'group_flag', 'false');
        await updateParamByUniqueKeyVkId(ctx.message.user_id.toString(), 'app_flag', 'false');
        // Показать пользователю сообщение
        // await bot.sendMessage(ctx.message.user_id, 'Эй, бро, ты куда?');
        message2('Эй, бро, ты куда?', ctx, false, false);
    } else {

        // Получить данные об уведомлениях в приложении
        var groupFlag = false;
        if (res.group_flag.S == 'false') {
            groupFlag = false;
        } else {
            groupFlag = true;
        }
        var appFlag = false;
        if (res.app_flag.S == 'false') {
            appFlag = false;
        } else {
            appFlag = true;
        }
        // await bot.sendMessage(ctx.message.user_id, 'Эй, бро, ты куда?');
        message2('Эй, бро, ты куда?', ctx, groupFlag, appFlag);
    }
    done = true;
});


// ? Отправляет пользователям кастомное уведомление в лс.
async function sendCustomNotifyMessage(messageText, buttonLink, buttonText) {
    if (buttonLink == 'null') buttonLink = null;
    if (buttonText == 'null') buttonText = null;

    // 1. Получить из бд список всех юзеров
    var allUsers = await getAllUsers();

    // 2. Отфильтровать по флагу app_flag
    // Целевой список юзеров, которым нобходимо отправить сообщение
    var allTargetUsers = [];
    allUsers.forEach(function (e) {
        if (e['app_flag'] != null && e['app_flag']['S'] != null) {
            // Если у юзера есть подписка на новые записи в группе
            if (e['app_flag']['S'] == 'true') {
                // Добавить его в целевой список юзеров
                allTargetUsers.push(e['unique_key_vk_id']['S']);
            }
        }
    });
    // 3. Разбить на партии по 100 юзеров
    var chunks = chunkArray(allTargetUsers, 100);

    // 4. В цикле отправлять по 100 сообщений за раз.
    if (chunks.length > 0) {
        for (var i = 0; i < chunks.length; i++) {
            // Пользователю отправляется текст новой записи
            await bot.sendMessage(chunks[i], messageText, null,
                buttonLink != null ? Markup
                    .keyboard([
                        // И кнопка "Открыть запись"
                        Markup.button({
                            action: {
                                type: 'open_link',
                                link: buttonLink,
                                label: buttonText != null ? buttonText : 'Открыть',
                                payload: JSON.stringify({
                                    url: buttonLink,
                                }),
                            },
                        }),
                    ]).inline() : null,
            );
        }
    }
    // test
    // Тестовый вывод контрольного списка id пользователей, которым нужно отправить сообщение
    // console.log(chunks); 
}

// ? Неизвестная команда (должна стоять в конце)
bot.on(async (ctx) => {


    // Отправить ссылку (у кнопки не должно быть цвета?)
    // ctx.reply('Hey!', null, Markup
    //   .keyboard([
    //     Markup.button({
    //       action: {
    //         type: 'open_link',
    //         link: 'https://google.com',
    //         label: 'Open Google',
    //         payload: JSON.stringify({
    //           url: 'https://google.com',
    //         }),
    //       },
    //     }),
    //   ]),
    // );

    // Отправить кнопку с приложением (у кнопки не должно быть цвета?)
    // ctx.reply('Hey!', null, Markup
    //   .keyboard([
    //     Markup.button({
    //       action: {
    //         type: 'open_app',
    //         app_id: 7716083,
    //         owner_id: 185007106,
    //         label: 'открыть',
    //         payload: JSON.stringify({
    //           url: 'https://google.com',
    //         }),
    //       },
    //     }),
    //   ]),
    // );



    // // Кнопка обратного вызова:
    // ctx.reply('Hey!', null, Markup
    //     .keyboard([
    //         Markup.button({
    //             action: {
    //                 type: "callback",
    //                 label: 'Это кнопка обратного вызова',
    //                 payload: JSON.stringify({
    //                     url: 'https://google.com',
    //                 }),
    //             },
    //             color: 'positive',
    //         }),
    //     ]),
    // );



    // норм http запрос
    // const userId = ctx.message.from_id || ctx.message.user_id;
    // const text = ctx.message.body;
    // const resultMessage = 'https://vk.com/id'+userId.toString() + '%0A' + ctx.message.body;
    // https.get('https://api.telegram.org/bot1483319543:AAEWK5cRJzk1CuLLZR7AVmfHiqFS35pDKCE/sendMessage?chat_id=-1001416188983&disable_web_page_preview=true&text='+resultMessage, (resp) => {
    //   let data = '';

    //     // A chunk of data has been received.
    //     resp.on('data', (chunk) => {
    //       data += chunk;
    //     });

    //     // The whole response has been received. Print out the result.
    //     resp.on('end', () => {
    //       console.log(JSON.parse(data).explanation);
    //     });

    //   }).on("error", (err) => {
    //   console.log("Error: " + err.message);
    // });
});

// Сообщения:
// Сообщение 1 (Ифнормационное сообщение)
function message1(ctx, groupFlag, appFlag) {
    var messageText = 'Наш чат-бот может своевременно отправлять вам уведомления в лс о новых записях в группе и приложении.';
    keyboardMain(messageText, ctx, groupFlag, appFlag)
}

// Сообщение 2 (Кастомное сообщение с любым текстом)
function message2(messageText, ctx, groupFlag, appFlag) {
    keyboardMain(messageText, ctx, groupFlag, appFlag)
}


// Клавиатуры:
// Клавиатура 1 (основная клавиватура)
function keyboardMain(messageText, ctx, groupFlag, appFlag) {
    ctx.reply(messageText, null, Markup
        .keyboard([
            [
                groupFlag ? Markup.button('Записи в группе (отключить)', 'secondary') :
                    Markup.button('Записи в группе (включить)', 'positive'),
            ],
            [
                appFlag ? Markup.button('Новинки в приложении (отключить)', 'secondary') :
                    Markup.button('Новинки в приложении (включить)', 'positive'),
            ],
            [
                Markup.button('Категории', 'primary'),
            ],

            [
                Markup.button('Информация', 'primary'),
                Markup.button('Заработать 💰', 'primary')
            ],
        ]),
    );
}

/// Функции для работы с базой данных юзеров (YDB)

// Получение пользователя из базы данных по его id (string)
async function getElementByUniqueKeyVkId(uniqueKey) {
    // Подготовить объект для записи в Yandex Database (тело запроса):
    var data = {
        // Название таблицы в YDB:
        "TableName": YANDEX_DATABASE_PATH,
        // Объект-элемент:
        "Key": {
            // Уникальный ключ таблицы для Yandex Database:
            "unique_key_vk_id": {
                "S": uniqueKey
            }
        }
    };

    // Подготовить и отправить данные в Yandex Database:
    let response = await fetch(YANDEX_DATABASE_ENDPOINT, {
        'method': 'post',
        'contentType': 'application/json',
        'headers': {
            'X-Amz-Target': 'DynamoDB_20120810.GetItem',
            'Authorization': 'Bearer ' + YANDEX_CLOUD_IAMTOKEN,
            'Content-Type': 'application.json'
        },
        body: JSON.stringify(data)
    });

    let result = await response.json();
    // console.log(result['Item']);
    return result['Item'];
}

// Добавление нового пользователя в базу данных по его id (string)
async function addElementByUniqueKeyVkId(uniqueKey) {
    // Подготовить объект для записи в Yandex Database (тело запроса):
    var data = {
        // Название таблицы в YDB:
        "TableName": YANDEX_DATABASE_PATH,
        // Объект-элемент:
        "Item": {
            // Уникальный ключ таблицы для Yandex Database:
            "unique_key_vk_id": {
                "S": uniqueKey
            }
        }
    };

    // Подготовить и отправить данные в Yandex Database:
    let response = await fetch(YANDEX_DATABASE_ENDPOINT, {
        'method': 'post',
        'contentType': 'application/json',
        'headers': {
            'X-Amz-Target': 'DynamoDB_20120810.PutItem',
            'Authorization': 'Bearer ' + YANDEX_CLOUD_IAMTOKEN,
            'Content-Type': 'application.json'
        },
        body: JSON.stringify(data)
    });

    let result = await response.json();
}

// Обновляет/Добавляет параметр пользователя по его id
// с названием key
// и значением value
async function updateParamByUniqueKeyVkId(uniqueKey, key, value) {
    // Подготовить объект для записи в Yandex Database (тело запроса):
    var data = {
        // Название таблицы в YDB:
        "TableName": YANDEX_DATABASE_PATH,

        // Уникальный ключ записи, для которой нужно обновить значение полей   
        "Key": {
            "unique_key_vk_id": {
                "S": uniqueKey
            }
        },
        // Инициализация значений
        "ExpressionAttributeValues": {
            ":val1": { "S": value }
        },

        // YQL - запрос
        "UpdateExpression": "SET " + key + " = :val1"
    };

    // Подготовить и отправить данные в Yandex Database:
    let response = await fetch(YANDEX_DATABASE_ENDPOINT, {
        'method': 'post',
        'contentType': 'application/json',
        'headers': {
            'X-Amz-Target': 'DynamoDB_20120810.UpdateItem',
            'Authorization': 'Bearer ' + YANDEX_CLOUD_IAMTOKEN,
            'Content-Type': 'application.json'
        },
        body: JSON.stringify(data)
    });

    let result = await response.json();
}

// Получение всех юзеров из бд
async function getAllUsers() {
    // Отправка данных в Yandex Database:

    // Получить IAMtoken:
    // var IAMtoken = await getIAMToken();
    var IAMtoken = await getIAMToken();

    // Тело запроса
    var data = {
        "TableName": YANDEX_DATABASE_PATH
    };

    // Список результирующих всех записей из бд
    var allData = [];

    while (true) {
        let response = await fetch(YANDEX_DATABASE_ENDPOINT, {
            'method': 'post',
            'contentType': 'application/json',
            'headers': {
                'X-Amz-Target': 'DynamoDB_20120810.Scan',
                'Authorization': 'Bearer ' + YANDEX_CLOUD_IAMTOKEN,
                'Content-Type': 'application.json'
            },
            body: JSON.stringify(data)
        });

        // Распаршеные данные (key, value):
        var rawData = await response.json();

        // Список нужных объектов:
        rawData['Items'].forEach(function (e) {
            allData.push(e);
        });

        if (rawData['Count'] < 100) break;

        // Иначе
        // Добавляем ключ, с которого начать получение данных
        data = {
            "TableName": YANDEX_DATABASE_PATH,
            "ExclusiveStartKey": {
                'unique_key_vk_id': allData[allData.length - 1]['unique_key_vk_id']
            }
        };

    }
    return allData;
}

// Функция для получения IAM токена для работы с Yandex Database
async function getIAMToken() {
    var rawData = await fetch(YANDEX_CLOUD_FUNCTION_IAMTOKEN_LINK);
    var result = await rawData.json();
    var IAMtoken = result['access_token'];
    return IAMtoken;
}

// Разбивает массив array на подмассивы длиной chunk
// Возвращает массив подмассивов
function chunkArray(array, chunk) {
    const newArray = [];
    for (let i = 0; i < array.length; i += chunk) {
        newArray.push(array.slice(i, i + chunk));
    }
    return newArray;
}
