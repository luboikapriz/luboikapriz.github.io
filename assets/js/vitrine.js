jQuery(function ($) {

    let $dataNMessage = $("[data-n-message]");
    let $widgetPreview = $(".desktop-visible .widget_notice, .mobile-visible .widget_notice");
    let $container = $("#offersContainer");
    let $offerLegal = $("#offer_legal");
    let $filterAction = $("[data-filter]");
    let $filterTillDate = $("[data-filter-till-date]");
    let $filterResultSum = $("[data-filter-result-sum]");
    let $filterSum = $("[data-filter-sum]");
    let $filterPeriod = $("[data-filter-period]");

    let offersData = [];
    let consumerData = null;
    // If consumer was on all offers disable filter.
    let disableConsumerHistory = false;

    /**
     * show credit notice every random time
     */
    setTimeout(function () {
        generateNotice();
    }, 2450);

    /**
     * set page color scheme
     */
    if (typeof colorScheme !== "undefined") {

        changeColorScheme(`scheme_${colorScheme}`);

    }

    /**
     * google tag manager
     */
    if (typeof gtmId !== "undefined") {

        (function (w, d, s, l, i) {
            w[l] = w[l] || [];
            w[l].push({
                'gtm.start':
                    new Date().getTime(), event: 'gtm.js'
            });
            var f = d.getElementsByTagName(s)[0],
                j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : '';
            j.async = true;
            j.src =
                'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
            f.parentNode.insertBefore(j, f);
        })(window, document, 'script', 'dataLayer', gtmId);

    } else {

        (function (w, d, s, l, i) {
            w[l] = w[l] || [];
            w[l].push({
                'gtm.start':
                    new Date().getTime(), event: 'gtm.js'
            });
            var f = d.getElementsByTagName(s)[0],
                j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : '';
            j.async = true;
            j.src =
                'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
            f.parentNode.insertBefore(j, f);
        })(window, document, 'script', 'dataLayer', "GTM-PHB56NQ");

    }

    loadAndRenderOffers();

    /**
     * when click button "show results"
     * filter offers by sum and period
     */
    $filterAction.click(function () {

        let sum = $filterSum.val();
        let period = $filterPeriod.val();

        console.log(sum)

        sum = parseInt(sum);
        sum = isNaN(sum) ? 0 : sum;
        period = parseInt(period);
        period = isNaN(period) ? 0 : period;

        if ($filterResultSum.length > 0) {

            $filterResultSum.html(`${sum} ${countryCurrency ? countryCurrency : "грн"}.`);

        }

        if ($filterTillDate.length > 0) {
            let date = (new Date);

            date.setDate(date.getDate() + period);

            $filterTillDate.html(dateFormat(date, $filterTillDate.get(0).dataset.filterTillDate));

        }

        let filter = {
            sum: sum,
            period: period,
        };

        if (offersData.length > 0) {

            $container.html(renderOffers(offersData, filter));

            if (typeof colorScheme !== "undefined") {

                changeColorScheme(`scheme_${colorScheme}`);

            }

        } else {

            loadAndRenderOffers()

        }

        $([document.documentElement, document.body]).animate({
            scrollTop: $(".offers_wrap").add($(".offers_wrapper")).add($("#offers")).offset().top
        }, 1000);

    });

    /**
     * Load offers
     */
    function loadAndRenderOffers() {

        /**
         * get all offers data
         */
        loadOffers()
            .then(function (res) {

                if (!consumerData && allVitrineData && allVitrineData.offer && allVitrineData.offer.sortby && allVitrineData.offer.sortby.toLowerCase() === "smart") {
                    getCustomerData()
                        .then(function (customer) {
                            consumerData = customer.data;
                            $container.html(renderOffers(res));
                        });

                    //Need delay for 1 sec if consumer data will be loaded more than for 1 sec.
                    setTimeout(function () {
                        renderLoadedOffers(res);
                    }, 1100);

                } else {
                    renderLoadedOffers(res);
                }

            });

    }

    /**
     * Render already loaded offers
     *
     * @param res
     */
    function renderLoadedOffers(res) {

        if (Array.isArray(res)) {

            $container.html(renderOffers(res));
            $offerLegal.html(renderOfferLegal(res));

            if (typeof colorScheme !== "undefined") {

                changeColorScheme(`scheme_${colorScheme}`);

            }

        }

        return res;

    }

    /**
     * Load offers.
     *
     * @returns {Promise<{}>}
     */
    function loadOffers() {

        return new Promise(function (resolve, rej) {

            offersData = offersDataLoaded;
            resolve(typeof offersDataLoaded !== "undefined" && offersDataLoaded ? offersDataLoaded : {});

        });

    }

    /**
     * @param data
     * @param filterData
     */
    function renderOffers(data, filterData = {}) {

        let rows = renderOfferRows(data, filterData);

        if (rows.join('').length === 0) {
            disableConsumerHistory = true;
            rows = renderOfferRows(data, filterData);
        }

        let chunkClass = $container.data("chunk-class");

        if (chunkClass) {

            return chunk(rows, 3).map(rows => {

                return `
                    <ul class="${chunkClass}">
                        ${rows.join("")}
                    </ul>
                `;

            }).join("");

        } else {

            return rows.join("")

        }

    }

    /**
     *
     * @param data
     * @returns {string}
     */
    function renderOfferLegal(data) {

        return data.map(offer => {
            return `<p class="info-content--text">${offer.name}: </p>${offer.legal_info}`
        }).join("")

    }

    /**
     * Render offers.
     *
     * @param data
     * @param filter
     */
    function renderOfferRows(data, filterData = {}) {

        return data.map(offer => {

            let filter = {
                sum: 1000,
                period: 0,
                ...filterData
            };

            if (
                !disableConsumerHistory &&
                allVitrineData && allVitrineData.offer &&
                allVitrineData.offer.sortby &&
                allVitrineData.offer.sortby.toLowerCase() === "smart" &&
                consumerData &&
                consumerData[offer.id] &&
                consumerData[offer.id].clicks_count &&
                (
                    consumerData[offer.id].clicks.filter(click => +new Date(click.time) > (new Date() - (3600000 * 24 * 14))).length > 0 ||
                    consumerData[offer.id].lead_count > 0
                )
            ) {

                return "";

            }

            offer.score = parseInt(offer.score);
            offer.score = isNaN(offer.score) ? 0 : offer.score;

            offer.first_credit = offer.first_credit ? offer.first_credit : "-";
            offer.first_credit_percent = toFloat(offer.first_credit_percent);
            offer.first_credit_percent_standard = toFloat(offer.first_credit_percent_standard);
            offer.commission = {};
            offer.summ = {};

            let summ = offer.first_credit.replace(/[^0-9\-]/g, "").split("-");
            summ.map(int => isNaN(parseFloat(int)) ? 0 : parseFloat(int));
            summ = summ.length > 1 ? summ : [0, summ[0]];

            filter.sum = isNaN(filter.sum) ? 0 : filter.sum;
            filter.period = isNaN(filter.period) ? 0 : filter.period;
            offer.commission.new = parseFloat(offer.first_credit_percent ? offer.first_credit_percent : 0) / 100;
            offer.commission.old = parseFloat(offer.first_credit_percent_standard ? offer.first_credit_percent_standard : 0) / 100;
            offer.term = toFloat(offer.term);
            filter.period = filter.period > 0 ? filter.period : offer.term;
            offer.commission.new = (Math.round(offer.commission.new * filter.sum * filter.period * 100) / 100);
            offer.commission.old = (Math.round(offer.commission.old * filter.sum * filter.period * 100) / 100);
            offer.summ.counted = Math.round((filter.sum + offer.commission.new) * 100) / 100;

            offer.summ.min = summ[0];
            offer.summ.max = summ[1];
            offer.summ.required = filter.sum;
            offer.reviewsText = pluralForm(offer.reviews, [loc("отзыв"), loc("отзыва"), loc("отзывов")]);

            offer.image = offer.image.replace("https://pdl-profit.com/", "/gallery.php?path=");

            if ((typeof isAdv === "undefined" || !isAdv) && offer.term < filter.period) {

                return "";

            }

            if (offer.summ.max < filter.sum) {

                return "";

            }

            offer.url = getOfferUrl(offer);
            offer.land_tooltip = typeof offer.land_tooltip !== "undefined" && offer.land_tooltip ? loc(offer.land_tooltip) : "";

            return offerThemplate(offer);

        });

    }

    /**
     * Generates offers url.
     *
     * @param offer
     * @returns {*}
     */
    function getOfferUrl(offer) {

        let obj = Object.assign(queryToObj(offer.url), queryToObj(location.search));

        if (cHash) {

            obj.c = cHash;

        }

        return (offer.url.slice(0, offer.url.indexOf("?"))) + objectToQuery(obj);

    }

    /**
     * Plural form.
     *
     * @param numger
     * @param variants
     * @returns {*}
     */
    function pluralForm(numger, variants) {

        numger = parseFloat(numger);
        numger = isNaN(numger) ? 0 : numger;

        return variants[(numger % 100 > 4 && numger % 100 < 20) ? 2 : [2, 0, 1, 1, 1, 2][Math.min(numger % 10, 5)]];

    }

    /**
     * @param digit
     * @returns {number}
     */
    function toFloat(digit) {

        if (typeof digit == "string") {
            digit = digit ? digit.replace(",", ".") : digit;
        }

        return parseFloat(digit ? digit : 0)

    }

    /**
     * Generates random credit notice.
     */
    function generateNotice() {

        let users = typeof countryNames !== "undefined" && countryNames ? countryNames : [
            ["Анастасия", "Мария", "София", "Вероника", "Виктория", "Соломия", "Ангелина", "Злата", "Анна", "Ева", "Полина", "Алиса", "Александра", "Милана", "Дарья", "Арина", "Дарина", "Кира", "Екатерина"],
            ["Артем", "Александр", "Максим", "Дмитрий", "Матвей", "Назар", "Богдан", "Марк", "Владислав", "Михаил", "Владимир", "Иван", "Давид", "Андрей"]
        ];

        let actions = typeof creditActions !== "undefined" && creditActions ? creditActions : [
            ["получила займ", "подалa заявку", "выплатилa займ"],
            ["получил займ", "подал заявку", "выплатил займ"],
        ];

        let cities = typeof allCitiesDataList !== "undefined" && allCitiesDataList ? allCitiesDataList :
            {
                "id": "5", "parent_id": null, "name": "Украина", "areas": [{
                    "id": "2121",
                    "parent_id": "5",
                    "name": "Винницкая область",
                    "areas": [{"id": "3331", "parent_id": "2121", "name": "Бар", "areas": []}, {
                        "id": "3332",
                        "parent_id": "2121",
                        "name": "Бершадь",
                        "areas": []
                    }, {"id": "116", "parent_id": "2121", "name": "Винница", "areas": []}, {
                        "id": "3333",
                        "parent_id": "2121",
                        "name": "Гайсин",
                        "areas": []
                    }, {"id": "3641", "parent_id": "2121", "name": "Гнивань", "areas": []}, {
                        "id": "3334",
                        "parent_id": "2121",
                        "name": "Жмеринка",
                        "areas": []
                    }, {"id": "3335", "parent_id": "2121", "name": "Ильинцы", "areas": []}, {
                        "id": "3336",
                        "parent_id": "2121",
                        "name": "Казатин",
                        "areas": []
                    }, {"id": "3337", "parent_id": "2121", "name": "Калиновка", "areas": []}, {
                        "id": "3338",
                        "parent_id": "2121",
                        "name": "Крыжополь",
                        "areas": []
                    }, {"id": "3339", "parent_id": "2121", "name": "Ладыжин", "areas": []}, {
                        "id": "3340",
                        "parent_id": "2121",
                        "name": "Липовец",
                        "areas": []
                    }, {"id": "3341", "parent_id": "2121", "name": "Литин", "areas": []}, {
                        "id": "3342",
                        "parent_id": "2121",
                        "name": "Могилев-Подольский",
                        "areas": []
                    }, {"id": "3343", "parent_id": "2121", "name": "Мурованые Куриловцы", "areas": []}, {
                        "id": "3344",
                        "parent_id": "2121",
                        "name": "Немиров",
                        "areas": []
                    }, {"id": "3345", "parent_id": "2121", "name": "Оратов", "areas": []}, {
                        "id": "3346",
                        "parent_id": "2121",
                        "name": "Песчанка",
                        "areas": []
                    }, {"id": "3347", "parent_id": "2121", "name": "Погребище", "areas": []}, {
                        "id": "3348",
                        "parent_id": "2121",
                        "name": "Теплик",
                        "areas": []
                    }, {"id": "3349", "parent_id": "2121", "name": "Томашполь", "areas": []}, {
                        "id": "3350",
                        "parent_id": "2121",
                        "name": "Тростянец (Винницкая область)",
                        "areas": []
                    }, {"id": "3351", "parent_id": "2121", "name": "Тульчин", "areas": []}, {
                        "id": "3352",
                        "parent_id": "2121",
                        "name": "Тывров",
                        "areas": []
                    }, {"id": "3353", "parent_id": "2121", "name": "Хмельник", "areas": []}, {
                        "id": "3354",
                        "parent_id": "2121",
                        "name": "Чечельник",
                        "areas": []
                    }, {"id": "3355", "parent_id": "2121", "name": "Шаргород", "areas": []}, {
                        "id": "3356",
                        "parent_id": "2121",
                        "name": "Ямполь (Винницкая область)",
                        "areas": []
                    }]
                }, {
                    "id": "2123",
                    "parent_id": "5",
                    "name": "Волынская область",
                    "areas": [{"id": "3634", "parent_id": "2123", "name": "Берестечко", "areas": []}, {
                        "id": "3604",
                        "parent_id": "2123",
                        "name": "Владимир-Волынский",
                        "areas": []
                    }, {"id": "3605", "parent_id": "2123", "name": "Горохов", "areas": []}, {
                        "id": "3606",
                        "parent_id": "2123",
                        "name": "Иваничи",
                        "areas": []
                    }, {"id": "3607", "parent_id": "2123", "name": "Камень-Каширский", "areas": []}, {
                        "id": "3608",
                        "parent_id": "2123",
                        "name": "Киверцы",
                        "areas": []
                    }, {"id": "2124", "parent_id": "2123", "name": "Ковель", "areas": []}, {
                        "id": "3609",
                        "parent_id": "2123",
                        "name": "Локачи",
                        "areas": []
                    }, {"id": "124", "parent_id": "2123", "name": "Луцк", "areas": []}, {
                        "id": "3610",
                        "parent_id": "2123",
                        "name": "Любешов",
                        "areas": []
                    }, {"id": "3611", "parent_id": "2123", "name": "Любомль", "areas": []}, {
                        "id": "3612",
                        "parent_id": "2123",
                        "name": "Маневичи",
                        "areas": []
                    }, {"id": "3613", "parent_id": "2123", "name": "Нововолынск", "areas": []}, {
                        "id": "3614",
                        "parent_id": "2123",
                        "name": "Ратно",
                        "areas": []
                    }, {"id": "3615", "parent_id": "2123", "name": "Рожище", "areas": []}, {
                        "id": "3616",
                        "parent_id": "2123",
                        "name": "Старая Выжевка",
                        "areas": []
                    }, {"id": "3617", "parent_id": "2123", "name": "Турийск", "areas": []}, {
                        "id": "3652",
                        "parent_id": "2123",
                        "name": "Устилуг",
                        "areas": []
                    }, {"id": "3618", "parent_id": "2123", "name": "Шацк (Волынская область)", "areas": []}]
                }, {
                    "id": "2126",
                    "parent_id": "5",
                    "name": "Днепропетровская область",
                    "areas": [{"id": "3132", "parent_id": "2126", "name": "Апостолово", "areas": []}, {
                        "id": "3133",
                        "parent_id": "2126",
                        "name": "Васильковка",
                        "areas": []
                    }, {"id": "2717", "parent_id": "2126", "name": "Верхнеднепровск", "areas": []}, {
                        "id": "3621",
                        "parent_id": "2126",
                        "name": "Верховцево",
                        "areas": []
                    }, {"id": "2716", "parent_id": "2126", "name": "Вольногорск", "areas": []}, {
                        "id": "117",
                        "parent_id": "2126",
                        "name": "Днепр (Днепропетровск)",
                        "areas": []
                    }, {"id": "2127", "parent_id": "2126", "name": "Днепродзержинск", "areas": []}, {
                        "id": "2129",
                        "parent_id": "2126",
                        "name": "Желтые Воды",
                        "areas": []
                    }, {
                        "id": "3134",
                        "parent_id": "2126",
                        "name": "Зеленодольск (Днепропетровская область)",
                        "areas": []
                    }, {"id": "2101", "parent_id": "2126", "name": "Кривой Рог", "areas": []}, {
                        "id": "3135",
                        "parent_id": "2126",
                        "name": "Кринички",
                        "areas": []
                    }, {"id": "3136", "parent_id": "2126", "name": "Магдалиновка", "areas": []}, {
                        "id": "3137",
                        "parent_id": "2126",
                        "name": "Марганец",
                        "areas": []
                    }, {"id": "3138", "parent_id": "2126", "name": "Межевая", "areas": []}, {
                        "id": "2131",
                        "parent_id": "2126",
                        "name": "Никополь",
                        "areas": []
                    }, {
                        "id": "2132",
                        "parent_id": "2126",
                        "name": "Новомосковск (Днепропетровская область)",
                        "areas": []
                    }, {
                        "id": "3139",
                        "parent_id": "2126",
                        "name": "Покров (Днепропетровская область)",
                        "areas": []
                    }, {"id": "2133", "parent_id": "2126", "name": "Павлоград", "areas": []}, {
                        "id": "3645",
                        "parent_id": "2126",
                        "name": "Перещепино",
                        "areas": []
                    }, {"id": "3072", "parent_id": "2126", "name": "Першотравенск", "areas": []}, {
                        "id": "3141",
                        "parent_id": "2126",
                        "name": "Петриковка",
                        "areas": []
                    }, {"id": "3142", "parent_id": "2126", "name": "Петропавловка", "areas": []}, {
                        "id": "3646",
                        "parent_id": "2126",
                        "name": "Подгородное",
                        "areas": []
                    }, {"id": "3143", "parent_id": "2126", "name": "Покровское", "areas": []}, {
                        "id": "3144",
                        "parent_id": "2126",
                        "name": "Пятихатки",
                        "areas": []
                    }, {"id": "3145", "parent_id": "2126", "name": "Синельниково", "areas": []}, {
                        "id": "3146",
                        "parent_id": "2126",
                        "name": "Соленое",
                        "areas": []
                    }, {"id": "3147", "parent_id": "2126", "name": "Софиевка", "areas": []}, {
                        "id": "3148",
                        "parent_id": "2126",
                        "name": "Терновка",
                        "areas": []
                    }, {"id": "3149", "parent_id": "2126", "name": "Томаковка", "areas": []}, {
                        "id": "3150",
                        "parent_id": "2126",
                        "name": "Царичанка",
                        "areas": []
                    }, {"id": "3151", "parent_id": "2126", "name": "Широкое", "areas": []}, {
                        "id": "3152",
                        "parent_id": "2126",
                        "name": "Юрьевка",
                        "areas": []
                    }]
                }, {
                    "id": "2134",
                    "parent_id": "5",
                    "name": "Донецкая область",
                    "areas": [{"id": "3238", "parent_id": "2134", "name": "Авдеевка", "areas": []}, {
                        "id": "3239",
                        "parent_id": "2134",
                        "name": "Александровка (Донецкая область)",
                        "areas": []
                    }, {"id": "3240", "parent_id": "2134", "name": "Амвросиевка", "areas": []}, {
                        "id": "3630",
                        "parent_id": "2134",
                        "name": "Артемово",
                        "areas": []
                    }, {"id": "2135", "parent_id": "2134", "name": "Артемовск (Украина)", "areas": []}, {
                        "id": "3633",
                        "parent_id": "2134",
                        "name": "Белицкое",
                        "areas": []
                    }, {"id": "3242", "parent_id": "2134", "name": "Белозерское", "areas": []}, {
                        "id": "3243",
                        "parent_id": "2134",
                        "name": "Великая Новоселка",
                        "areas": []
                    }, {"id": "3244", "parent_id": "2134", "name": "Волноваха", "areas": []}, {
                        "id": "3245",
                        "parent_id": "2134",
                        "name": "Володарское (Донецкая область)",
                        "areas": []
                    }, {"id": "2136", "parent_id": "2134", "name": "Горловка", "areas": []}, {
                        "id": "3246",
                        "parent_id": "2134",
                        "name": "Дебальцево",
                        "areas": []
                    }, {
                        "id": "3247",
                        "parent_id": "2134",
                        "name": "Дзержинск (Донецкая область)",
                        "areas": []
                    }, {"id": "3248", "parent_id": "2134", "name": "Димитров", "areas": []}, {
                        "id": "3249",
                        "parent_id": "2134",
                        "name": "Доброполье",
                        "areas": []
                    }, {"id": "3250", "parent_id": "2134", "name": "Докучаевск", "areas": []}, {
                        "id": "118",
                        "parent_id": "2134",
                        "name": "Донецк (Украина)",
                        "areas": []
                    }, {"id": "2508", "parent_id": "2134", "name": "Дружковка", "areas": []}, {
                        "id": "2138",
                        "parent_id": "2134",
                        "name": "Енакиево",
                        "areas": []
                    }, {"id": "3251", "parent_id": "2134", "name": "Зугрэс", "areas": []}, {
                        "id": "3253",
                        "parent_id": "2134",
                        "name": "Кировское (Донецкая область)",
                        "areas": []
                    }, {"id": "2656", "parent_id": "2134", "name": "Константиновка", "areas": []}, {
                        "id": "2139",
                        "parent_id": "2134",
                        "name": "Краматорск",
                        "areas": []
                    }, {"id": "3255", "parent_id": "2134", "name": "Красный Лиман", "areas": []}, {
                        "id": "3619",
                        "parent_id": "2134",
                        "name": "Курахово",
                        "areas": []
                    }, {"id": "2140", "parent_id": "2134", "name": "Макеевка", "areas": []}, {
                        "id": "3256",
                        "parent_id": "2134",
                        "name": "Мангуш",
                        "areas": []
                    }, {"id": "2104", "parent_id": "2134", "name": "Мариуполь", "areas": []}, {
                        "id": "3258",
                        "parent_id": "2134",
                        "name": "Марьинка",
                        "areas": []
                    }, {"id": "3259", "parent_id": "2134", "name": "Моспино", "areas": []}, {
                        "id": "3260",
                        "parent_id": "2134",
                        "name": "Новоазовск",
                        "areas": []
                    }, {"id": "3262", "parent_id": "2134", "name": "Новогродовка", "areas": []}, {
                        "id": "3254",
                        "parent_id": "2134",
                        "name": "Покровск (Донецкая область)",
                        "areas": []
                    }, {"id": "3263", "parent_id": "2134", "name": "Родинское", "areas": []}, {
                        "id": "3241",
                        "parent_id": "2134",
                        "name": "Светлодарск",
                        "areas": []
                    }, {"id": "3626", "parent_id": "2134", "name": "Святогорск", "areas": []}, {
                        "id": "3784",
                        "parent_id": "2134",
                        "name": "Северск (Донецкая область)",
                        "areas": []
                    }, {"id": "3264", "parent_id": "2134", "name": "Селидово", "areas": []}, {
                        "id": "2142",
                        "parent_id": "2134",
                        "name": "Славянск",
                        "areas": []
                    }, {"id": "2143", "parent_id": "2134", "name": "Снежное", "areas": []}, {
                        "id": "3265",
                        "parent_id": "2134",
                        "name": "Соледар",
                        "areas": []
                    }, {"id": "3266", "parent_id": "2134", "name": "Старобешево", "areas": []}, {
                        "id": "3268",
                        "parent_id": "2134",
                        "name": "Тельманово",
                        "areas": []
                    }, {"id": "2144", "parent_id": "2134", "name": "Торез", "areas": []}, {
                        "id": "3269",
                        "parent_id": "2134",
                        "name": "Угледар",
                        "areas": []
                    }, {"id": "2145", "parent_id": "2134", "name": "Харцызск", "areas": []}, {
                        "id": "2146",
                        "parent_id": "2134",
                        "name": "Шахтерск (Украина)",
                        "areas": []
                    }, {"id": "2509", "parent_id": "2134", "name": "Ясиноватая", "areas": []}]
                }, {
                    "id": "2147",
                    "parent_id": "5",
                    "name": "Житомирская область",
                    "areas": [{"id": "3554", "parent_id": "2147", "name": "Андрушевка", "areas": []}, {
                        "id": "3555",
                        "parent_id": "2147",
                        "name": "Барановка",
                        "areas": []
                    }, {"id": "2148", "parent_id": "2147", "name": "Бердичев", "areas": []}, {
                        "id": "3556",
                        "parent_id": "2147",
                        "name": "Брусилов",
                        "areas": []
                    }, {"id": "3557", "parent_id": "2147", "name": "Володарск-Волынский", "areas": []}, {
                        "id": "3558",
                        "parent_id": "2147",
                        "name": "Дзержинск (Житомирская область)",
                        "areas": []
                    }, {"id": "3559", "parent_id": "2147", "name": "Емильчино", "areas": []}, {
                        "id": "119",
                        "parent_id": "2147",
                        "name": "Житомир",
                        "areas": []
                    }, {"id": "3560", "parent_id": "2147", "name": "Иршанск", "areas": []}, {
                        "id": "2150",
                        "parent_id": "2147",
                        "name": "Коростень",
                        "areas": []
                    }, {"id": "3561", "parent_id": "2147", "name": "Коростышев", "areas": []}, {
                        "id": "3562",
                        "parent_id": "2147",
                        "name": "Лугины",
                        "areas": []
                    }, {"id": "3563", "parent_id": "2147", "name": "Любар", "areas": []}, {
                        "id": "3067",
                        "parent_id": "2147",
                        "name": "Малин",
                        "areas": []
                    }, {"id": "3564", "parent_id": "2147", "name": "Народичи", "areas": []}, {
                        "id": "2151",
                        "parent_id": "2147",
                        "name": "Новоград-Волынский",
                        "areas": []
                    }, {"id": "3565", "parent_id": "2147", "name": "Овруч", "areas": []}, {
                        "id": "3566",
                        "parent_id": "2147",
                        "name": "Олевск",
                        "areas": []
                    }, {"id": "3567", "parent_id": "2147", "name": "Попельня", "areas": []}, {
                        "id": "2713",
                        "parent_id": "2147",
                        "name": "Радомышль",
                        "areas": []
                    }, {"id": "3568", "parent_id": "2147", "name": "Романов", "areas": []}, {
                        "id": "3569",
                        "parent_id": "2147",
                        "name": "Ружин",
                        "areas": []
                    }, {"id": "3570", "parent_id": "2147", "name": "Червоноармейск", "areas": []}, {
                        "id": "3571",
                        "parent_id": "2147",
                        "name": "Черняхов",
                        "areas": []
                    }, {"id": "3572", "parent_id": "2147", "name": "Чуднов", "areas": []}]
                }, {
                    "id": "2152",
                    "parent_id": "5",
                    "name": "Закарпатская область",
                    "areas": [{"id": "3592", "parent_id": "2152", "name": "Берегово", "areas": []}, {
                        "id": "3593",
                        "parent_id": "2152",
                        "name": "Великий Березный",
                        "areas": []
                    }, {"id": "3594", "parent_id": "2152", "name": "Виноградов", "areas": []}, {
                        "id": "3595",
                        "parent_id": "2152",
                        "name": "Воловец",
                        "areas": []
                    }, {"id": "3596", "parent_id": "2152", "name": "Иршава", "areas": []}, {
                        "id": "3597",
                        "parent_id": "2152",
                        "name": "Межгорье (Закарпатская область)",
                        "areas": []
                    }, {"id": "2153", "parent_id": "2152", "name": "Мукачево", "areas": []}, {
                        "id": "3598",
                        "parent_id": "2152",
                        "name": "Перечин",
                        "areas": []
                    }, {"id": "3599", "parent_id": "2152", "name": "Рахов", "areas": []}, {
                        "id": "3600",
                        "parent_id": "2152",
                        "name": "Свалява",
                        "areas": []
                    }, {"id": "3601", "parent_id": "2152", "name": "Тячев", "areas": []}, {
                        "id": "134",
                        "parent_id": "2152",
                        "name": "Ужгород",
                        "areas": []
                    }, {"id": "3602", "parent_id": "2152", "name": "Хуст", "areas": []}, {
                        "id": "3603",
                        "parent_id": "2152",
                        "name": "Чоп",
                        "areas": []
                    }]
                }, {
                    "id": "2155",
                    "parent_id": "5",
                    "name": "Запорожская область",
                    "areas": [{"id": "3201", "parent_id": "2155", "name": "Акимовка", "areas": []}, {
                        "id": "2156",
                        "parent_id": "2155",
                        "name": "Бердянск",
                        "areas": []
                    }, {"id": "3202", "parent_id": "2155", "name": "Большая Белозерка", "areas": []}, {
                        "id": "3203",
                        "parent_id": "2155",
                        "name": "Васильевка",
                        "areas": []
                    }, {"id": "3205", "parent_id": "2155", "name": "Веселое", "areas": []}, {
                        "id": "3206",
                        "parent_id": "2155",
                        "name": "Вольнянск",
                        "areas": []
                    }, {"id": "2720", "parent_id": "2155", "name": "Гуляйполе", "areas": []}, {
                        "id": "3207",
                        "parent_id": "2155",
                        "name": "Днепрорудное",
                        "areas": []
                    }, {"id": "120", "parent_id": "2155", "name": "Запорожье", "areas": []}, {
                        "id": "3208",
                        "parent_id": "2155",
                        "name": "Каменка-Днепровская",
                        "areas": []
                    }, {"id": "3209", "parent_id": "2155", "name": "Кирилловка", "areas": []}, {
                        "id": "2718",
                        "parent_id": "2155",
                        "name": "Куйбышево",
                        "areas": []
                    }, {"id": "2158", "parent_id": "2155", "name": "Мелитополь", "areas": []}, {
                        "id": "3210",
                        "parent_id": "2155",
                        "name": "Михайловка (Запорожская область)",
                        "areas": []
                    }, {"id": "3644", "parent_id": "2155", "name": "Молочанск", "areas": []}, {
                        "id": "2719",
                        "parent_id": "2155",
                        "name": "Новониколаевка",
                        "areas": []
                    }, {"id": "3211", "parent_id": "2155", "name": "Орехов", "areas": []}, {
                        "id": "3212",
                        "parent_id": "2155",
                        "name": "Пологи",
                        "areas": []
                    }, {"id": "3213", "parent_id": "2155", "name": "Приазовское", "areas": []}, {
                        "id": "3214",
                        "parent_id": "2155",
                        "name": "Приморск (Запорожская область)",
                        "areas": []
                    }, {"id": "2721", "parent_id": "2155", "name": "Розовка", "areas": []}, {
                        "id": "3215",
                        "parent_id": "2155",
                        "name": "Токмак",
                        "areas": []
                    }, {"id": "3216", "parent_id": "2155", "name": "Черниговка", "areas": []}, {
                        "id": "2159",
                        "parent_id": "2155",
                        "name": "Энергодар",
                        "areas": []
                    }]
                }, {
                    "id": "2160",
                    "parent_id": "5",
                    "name": "Ивано-Франковская область",
                    "areas": [{"id": "3447", "parent_id": "2160", "name": "Богородчаны", "areas": []}, {
                        "id": "3448",
                        "parent_id": "2160",
                        "name": "Болехов",
                        "areas": []
                    }, {"id": "3449", "parent_id": "2160", "name": "Бурштын", "areas": []}, {
                        "id": "3450",
                        "parent_id": "2160",
                        "name": "Верховина",
                        "areas": []
                    }, {
                        "id": "3451",
                        "parent_id": "2160",
                        "name": "Галич (Ивано-Франковская область)",
                        "areas": []
                    }, {"id": "3452", "parent_id": "2160", "name": "Городенка", "areas": []}, {
                        "id": "3453",
                        "parent_id": "2160",
                        "name": "Долина",
                        "areas": []
                    }, {"id": "121", "parent_id": "2160", "name": "Ивано-Франковск", "areas": []}, {
                        "id": "2162",
                        "parent_id": "2160",
                        "name": "Калуш",
                        "areas": []
                    }, {"id": "2163", "parent_id": "2160", "name": "Коломыя", "areas": []}, {
                        "id": "3454",
                        "parent_id": "2160",
                        "name": "Косов",
                        "areas": []
                    }, {"id": "3455", "parent_id": "2160", "name": "Надворная", "areas": []}, {
                        "id": "3456",
                        "parent_id": "2160",
                        "name": "Перегинское",
                        "areas": []
                    }, {"id": "3457", "parent_id": "2160", "name": "Поляница", "areas": []}, {
                        "id": "3458",
                        "parent_id": "2160",
                        "name": "Рогатин",
                        "areas": []
                    }, {"id": "3459", "parent_id": "2160", "name": "Рожнятов", "areas": []}, {
                        "id": "3460",
                        "parent_id": "2160",
                        "name": "Снятын",
                        "areas": []
                    }, {"id": "3461", "parent_id": "2160", "name": "Тлумач", "areas": []}, {
                        "id": "3462",
                        "parent_id": "2160",
                        "name": "Тысменица",
                        "areas": []
                    }, {"id": "3463", "parent_id": "2160", "name": "Яремче", "areas": []}]
                }, {"id": "115", "parent_id": "5", "name": "Киев", "areas": []}, {
                    "id": "2164",
                    "parent_id": "5",
                    "name": "Киевская область",
                    "areas": [{"id": "3078", "parent_id": "2164", "name": "Барышевка", "areas": []}, {
                        "id": "2165",
                        "parent_id": "2164",
                        "name": "Белая Церковь",
                        "areas": []
                    }, {"id": "3079", "parent_id": "2164", "name": "Белогородка", "areas": []}, {
                        "id": "3080",
                        "parent_id": "2164",
                        "name": "Березань",
                        "areas": []
                    }, {"id": "3081", "parent_id": "2164", "name": "Богуслав", "areas": []}, {
                        "id": "2166",
                        "parent_id": "2164",
                        "name": "Борисполь",
                        "areas": []
                    }, {"id": "3082", "parent_id": "2164", "name": "Бородянка", "areas": []}, {
                        "id": "2445",
                        "parent_id": "2164",
                        "name": "Боярка",
                        "areas": []
                    }, {"id": "2167", "parent_id": "2164", "name": "Бровары", "areas": []}, {
                        "id": "3083",
                        "parent_id": "2164",
                        "name": "Буча",
                        "areas": []
                    }, {"id": "3084", "parent_id": "2164", "name": "Васильков", "areas": []}, {
                        "id": "3085",
                        "parent_id": "2164",
                        "name": "Вишневое",
                        "areas": []
                    }, {"id": "3086", "parent_id": "2164", "name": "Володарка", "areas": []}, {
                        "id": "3087",
                        "parent_id": "2164",
                        "name": "Ворзель",
                        "areas": []
                    }, {"id": "3088", "parent_id": "2164", "name": "Вышгород", "areas": []}, {
                        "id": "3089",
                        "parent_id": "2164",
                        "name": "Гнедин",
                        "areas": []
                    }, {"id": "2434", "parent_id": "2164", "name": "Гостомель", "areas": []}, {
                        "id": "3090",
                        "parent_id": "2164",
                        "name": "Згуровка",
                        "areas": []
                    }, {"id": "3091", "parent_id": "2164", "name": "Иванков", "areas": []}, {
                        "id": "3092",
                        "parent_id": "2164",
                        "name": "Ирпень",
                        "areas": []
                    }, {"id": "2676", "parent_id": "2164", "name": "Кагарлык", "areas": []}, {
                        "id": "3093",
                        "parent_id": "2164",
                        "name": "Макаров (Киевская область)",
                        "areas": []
                    }, {"id": "3094", "parent_id": "2164", "name": "Мироновка", "areas": []}, {
                        "id": "2673",
                        "parent_id": "2164",
                        "name": "Обухов",
                        "areas": []
                    }, {"id": "3095", "parent_id": "2164", "name": "Переяслав-Хмельницкий", "areas": []}, {
                        "id": "3096",
                        "parent_id": "2164",
                        "name": "Петровское",
                        "areas": []
                    }, {"id": "3097", "parent_id": "2164", "name": "Полесское", "areas": []}, {
                        "id": "3098",
                        "parent_id": "2164",
                        "name": "Ракитное (Киевская область)",
                        "areas": []
                    }, {"id": "2675", "parent_id": "2164", "name": "Ржищев", "areas": []}, {
                        "id": "3099",
                        "parent_id": "2164",
                        "name": "Сквира",
                        "areas": []
                    }, {"id": "3100", "parent_id": "2164", "name": "Славутич", "areas": []}, {
                        "id": "3101",
                        "parent_id": "2164",
                        "name": "Ставище",
                        "areas": []
                    }, {"id": "3102", "parent_id": "2164", "name": "Стоянка", "areas": []}, {
                        "id": "3103",
                        "parent_id": "2164",
                        "name": "Тараща",
                        "areas": []
                    }, {"id": "3104", "parent_id": "2164", "name": "Тетиев", "areas": []}, {
                        "id": "3105",
                        "parent_id": "2164",
                        "name": "Узин",
                        "areas": []
                    }, {"id": "2674", "parent_id": "2164", "name": "Украинка", "areas": []}, {
                        "id": "2168",
                        "parent_id": "2164",
                        "name": "Фастов",
                        "areas": []
                    }, {"id": "3106", "parent_id": "2164", "name": "Чабаны", "areas": []}, {
                        "id": "3107",
                        "parent_id": "2164",
                        "name": "Яготин",
                        "areas": []
                    }]
                }, {
                    "id": "2169",
                    "parent_id": "5",
                    "name": "Кировоградская область",
                    "areas": [{
                        "id": "2170",
                        "parent_id": "2169",
                        "name": "Александрия (Кировоградская область)",
                        "areas": []
                    }, {
                        "id": "3525",
                        "parent_id": "2169",
                        "name": "Александровка (Кировоградская область)",
                        "areas": []
                    }, {"id": "3526", "parent_id": "2169", "name": "Бобринец", "areas": []}, {
                        "id": "3527",
                        "parent_id": "2169",
                        "name": "Гайворон",
                        "areas": []
                    }, {"id": "3528", "parent_id": "2169", "name": "Голованевск", "areas": []}, {
                        "id": "3529",
                        "parent_id": "2169",
                        "name": "Добровеличковка",
                        "areas": []
                    }, {"id": "3530", "parent_id": "2169", "name": "Долинская", "areas": []}, {
                        "id": "2715",
                        "parent_id": "2169",
                        "name": "Знаменка",
                        "areas": []
                    }, {"id": "122", "parent_id": "2169", "name": "Кировоград", "areas": []}, {
                        "id": "3531",
                        "parent_id": "2169",
                        "name": "Компанеевка",
                        "areas": []
                    }, {"id": "3532", "parent_id": "2169", "name": "Малая Виска", "areas": []}, {
                        "id": "3533",
                        "parent_id": "2169",
                        "name": "Новгородка",
                        "areas": []
                    }, {"id": "3534", "parent_id": "2169", "name": "Новоархангельск", "areas": []}, {
                        "id": "3535",
                        "parent_id": "2169",
                        "name": "Новомиргород",
                        "areas": []
                    }, {"id": "3536", "parent_id": "2169", "name": "Новоукраинка", "areas": []}, {
                        "id": "3537",
                        "parent_id": "2169",
                        "name": "Ольшанка",
                        "areas": []
                    }, {"id": "3538", "parent_id": "2169", "name": "Онуфриевка", "areas": []}, {
                        "id": "3539",
                        "parent_id": "2169",
                        "name": "Петрово",
                        "areas": []
                    }, {"id": "2172", "parent_id": "2169", "name": "Светловодск", "areas": []}, {
                        "id": "3540",
                        "parent_id": "2169",
                        "name": "Ульяновка (Кировоградская область)",
                        "areas": []
                    }, {"id": "3541", "parent_id": "2169", "name": "Устиновка", "areas": []}]
                }, {
                    "id": "2173",
                    "parent_id": "5",
                    "name": "Луганская область",
                    "areas": [{
                        "id": "3628",
                        "parent_id": "2173",
                        "name": "Александровск (Луганская область)",
                        "areas": []
                    }, {"id": "3629", "parent_id": "2173", "name": "Алмазная", "areas": []}, {
                        "id": "2174",
                        "parent_id": "2173",
                        "name": "Алчевск",
                        "areas": []
                    }, {"id": "3374", "parent_id": "2173", "name": "Антрацит", "areas": []}, {
                        "id": "3375",
                        "parent_id": "2173",
                        "name": "Беловодск",
                        "areas": []
                    }, {"id": "3376", "parent_id": "2173", "name": "Белокуракино", "areas": []}, {
                        "id": "3377",
                        "parent_id": "2173",
                        "name": "Брянка",
                        "areas": []
                    }, {"id": "3378", "parent_id": "2173", "name": "Кировск", "areas": []}, {
                        "id": "3379",
                        "parent_id": "2173",
                        "name": "Краснодон",
                        "areas": []
                    }, {"id": "2175", "parent_id": "2173", "name": "Красный Луч", "areas": []}, {
                        "id": "3380",
                        "parent_id": "2173",
                        "name": "Кременная",
                        "areas": []
                    }, {"id": "2176", "parent_id": "2173", "name": "Лисичанск", "areas": []}, {
                        "id": "123",
                        "parent_id": "2173",
                        "name": "Луганск",
                        "areas": []
                    }, {"id": "3381", "parent_id": "2173", "name": "Лутугино", "areas": []}, {
                        "id": "3382",
                        "parent_id": "2173",
                        "name": "Марковка",
                        "areas": []
                    }, {"id": "3383", "parent_id": "2173", "name": "Меловое", "areas": []}, {
                        "id": "3384",
                        "parent_id": "2173",
                        "name": "Новоайдар",
                        "areas": []
                    }, {"id": "3385", "parent_id": "2173", "name": "Новопсков", "areas": []}, {
                        "id": "3386",
                        "parent_id": "2173",
                        "name": "Перевальск",
                        "areas": []
                    }, {"id": "3387", "parent_id": "2173", "name": "Попасная", "areas": []}, {
                        "id": "3388",
                        "parent_id": "2173",
                        "name": "Ровеньки",
                        "areas": []
                    }, {"id": "2513", "parent_id": "2173", "name": "Рубежное", "areas": []}, {
                        "id": "3389",
                        "parent_id": "2173",
                        "name": "Сватово",
                        "areas": []
                    }, {"id": "2958", "parent_id": "2173", "name": "Свердловск", "areas": []}, {
                        "id": "2178",
                        "parent_id": "2173",
                        "name": "Северодонецк",
                        "areas": []
                    }, {"id": "3390", "parent_id": "2173", "name": "Славяносербск", "areas": []}, {
                        "id": "3391",
                        "parent_id": "2173",
                        "name": "Станица Луганская",
                        "areas": []
                    }, {"id": "3392", "parent_id": "2173", "name": "Старобельск", "areas": []}, {
                        "id": "2179",
                        "parent_id": "2173",
                        "name": "Стаханов",
                        "areas": []
                    }, {"id": "3627", "parent_id": "2173", "name": "Счастье", "areas": []}, {
                        "id": "3393",
                        "parent_id": "2173",
                        "name": "Троицкое",
                        "areas": []
                    }, {"id": "3655", "parent_id": "2173", "name": "Червонопартизанск", "areas": []}]
                }, {
                    "id": "2180",
                    "parent_id": "5",
                    "name": "Львовская область",
                    "areas": [{"id": "3632", "parent_id": "2180", "name": "Белз", "areas": []}, {
                        "id": "3635",
                        "parent_id": "2180",
                        "name": "Бобрка",
                        "areas": []
                    }, {"id": "3178", "parent_id": "2180", "name": "Борислав", "areas": []}, {
                        "id": "3179",
                        "parent_id": "2180",
                        "name": "Броды",
                        "areas": []
                    }, {"id": "3180", "parent_id": "2180", "name": "Буск", "areas": []}, {
                        "id": "3637",
                        "parent_id": "2180",
                        "name": "Великие Мосты",
                        "areas": []
                    }, {"id": "3622", "parent_id": "2180", "name": "Винники", "areas": []}, {
                        "id": "3640",
                        "parent_id": "2180",
                        "name": "Глиняны",
                        "areas": []
                    }, {
                        "id": "3181",
                        "parent_id": "2180",
                        "name": "Городок (Львовская область)",
                        "areas": []
                    }, {"id": "3182", "parent_id": "2180", "name": "Добромиль", "areas": []}, {
                        "id": "2181",
                        "parent_id": "2180",
                        "name": "Дрогобыч",
                        "areas": []
                    }, {"id": "3643", "parent_id": "2180", "name": "Дубляны", "areas": []}, {
                        "id": "3183",
                        "parent_id": "2180",
                        "name": "Жидачов",
                        "areas": []
                    }, {"id": "3184", "parent_id": "2180", "name": "Жолква", "areas": []}, {
                        "id": "3185",
                        "parent_id": "2180",
                        "name": "Золочев (Львовская область)",
                        "areas": []
                    }, {"id": "2714", "parent_id": "2180", "name": "Каменка-Бугская", "areas": []}, {
                        "id": "125",
                        "parent_id": "2180",
                        "name": "Львов",
                        "areas": []
                    }, {"id": "3186", "parent_id": "2180", "name": "Моршин", "areas": []}, {
                        "id": "3187",
                        "parent_id": "2180",
                        "name": "Мостиска",
                        "areas": []
                    }, {"id": "3188", "parent_id": "2180", "name": "Новояворовск", "areas": []}, {
                        "id": "3189",
                        "parent_id": "2180",
                        "name": "Перемышляны",
                        "areas": []
                    }, {"id": "3190", "parent_id": "2180", "name": "Пустомыты", "areas": []}, {
                        "id": "3191",
                        "parent_id": "2180",
                        "name": "Рава-Русская",
                        "areas": []
                    }, {"id": "3192", "parent_id": "2180", "name": "Радехов", "areas": []}, {
                        "id": "3193",
                        "parent_id": "2180",
                        "name": "Роздол",
                        "areas": []
                    }, {"id": "3656", "parent_id": "2180", "name": "Рудки", "areas": []}, {
                        "id": "3194",
                        "parent_id": "2180",
                        "name": "Самбор",
                        "areas": []
                    }, {"id": "3195", "parent_id": "2180", "name": "Сколе", "areas": []}, {
                        "id": "3196",
                        "parent_id": "2180",
                        "name": "Сокаль",
                        "areas": []
                    }, {"id": "3197", "parent_id": "2180", "name": "Старый Самбор", "areas": []}, {
                        "id": "2183",
                        "parent_id": "2180",
                        "name": "Стрый",
                        "areas": []
                    }, {"id": "3198", "parent_id": "2180", "name": "Трускавец", "areas": []}, {
                        "id": "3199",
                        "parent_id": "2180",
                        "name": "Турка",
                        "areas": []
                    }, {"id": "3651", "parent_id": "2180", "name": "Угнев", "areas": []}, {
                        "id": "3653",
                        "parent_id": "2180",
                        "name": "Хыров",
                        "areas": []
                    }, {"id": "2184", "parent_id": "2180", "name": "Червоноград", "areas": []}, {
                        "id": "3200",
                        "parent_id": "2180",
                        "name": "Яворов",
                        "areas": []
                    }]
                }, {
                    "id": "2185",
                    "parent_id": "5",
                    "name": "Николаевская область",
                    "areas": [{"id": "3394", "parent_id": "2185", "name": "Арбузинка", "areas": []}, {
                        "id": "3395",
                        "parent_id": "2185",
                        "name": "Баштанка",
                        "areas": []
                    }, {"id": "3396", "parent_id": "2185", "name": "Березанка", "areas": []}, {
                        "id": "3397",
                        "parent_id": "2185",
                        "name": "Березнеговатое",
                        "areas": []
                    }, {"id": "3398", "parent_id": "2185", "name": "Братское", "areas": []}, {
                        "id": "3399",
                        "parent_id": "2185",
                        "name": "Веселиново",
                        "areas": []
                    }, {
                        "id": "3400",
                        "parent_id": "2185",
                        "name": "Вознесенск (Николаевская область)",
                        "areas": []
                    }, {"id": "3401", "parent_id": "2185", "name": "Врадиевка", "areas": []}, {
                        "id": "3402",
                        "parent_id": "2185",
                        "name": "Доманевка",
                        "areas": []
                    }, {"id": "2724", "parent_id": "2185", "name": "Еланец", "areas": []}, {
                        "id": "3403",
                        "parent_id": "2185",
                        "name": "Казанка",
                        "areas": []
                    }, {"id": "3404", "parent_id": "2185", "name": "Кривое Озеро", "areas": []}, {
                        "id": "126",
                        "parent_id": "2185",
                        "name": "Николаев",
                        "areas": []
                    }, {"id": "3405", "parent_id": "2185", "name": "Новая Одесса", "areas": []}, {
                        "id": "3406",
                        "parent_id": "2185",
                        "name": "Новый Буг",
                        "areas": []
                    }, {"id": "3407", "parent_id": "2185", "name": "Очаков", "areas": []}, {
                        "id": "2187",
                        "parent_id": "2185",
                        "name": "Первомайск (Украина)",
                        "areas": []
                    }, {"id": "3408", "parent_id": "2185", "name": "Снигиревка", "areas": []}, {
                        "id": "2949",
                        "parent_id": "2185",
                        "name": "Южноукраинск",
                        "areas": []
                    }]
                }, {
                    "id": "2188",
                    "parent_id": "5",
                    "name": "Одесская область",
                    "areas": [{"id": "3153", "parent_id": "2188", "name": "Ананьев", "areas": []}, {
                        "id": "3154",
                        "parent_id": "2188",
                        "name": "Арциз",
                        "areas": []
                    }, {"id": "3155", "parent_id": "2188", "name": "Балта", "areas": []}, {
                        "id": "2189",
                        "parent_id": "2188",
                        "name": "Белгород-Днестровский",
                        "areas": []
                    }, {"id": "3156", "parent_id": "2188", "name": "Беляевка", "areas": []}, {
                        "id": "3157",
                        "parent_id": "2188",
                        "name": "Березовка (Одесская область)",
                        "areas": []
                    }, {"id": "3158", "parent_id": "2188", "name": "Болград", "areas": []}, {
                        "id": "3159",
                        "parent_id": "2188",
                        "name": "Великая Михайловка",
                        "areas": []
                    }, {"id": "3638", "parent_id": "2188", "name": "Вилково", "areas": []}, {
                        "id": "3160",
                        "parent_id": "2188",
                        "name": "Ивановка (Одесская область)",
                        "areas": []
                    }, {"id": "2190", "parent_id": "2188", "name": "Измаил", "areas": []}, {
                        "id": "2191",
                        "parent_id": "2188",
                        "name": "Ильичевск",
                        "areas": []
                    }, {"id": "3161", "parent_id": "2188", "name": "Килия", "areas": []}, {
                        "id": "3162",
                        "parent_id": "2188",
                        "name": "Кодыма",
                        "areas": []
                    }, {"id": "3163", "parent_id": "2188", "name": "Коминтерновское", "areas": []}, {
                        "id": "3164",
                        "parent_id": "2188",
                        "name": "Котовск (Одесская область)",
                        "areas": []
                    }, {"id": "3165", "parent_id": "2188", "name": "Красные Окны", "areas": []}, {
                        "id": "3166",
                        "parent_id": "2188",
                        "name": "Любашевка",
                        "areas": []
                    }, {"id": "3168", "parent_id": "2188", "name": "Овидиополь", "areas": []}, {
                        "id": "127",
                        "parent_id": "2188",
                        "name": "Одесса",
                        "areas": []
                    }, {"id": "3169", "parent_id": "2188", "name": "Раздельная", "areas": []}, {
                        "id": "3170",
                        "parent_id": "2188",
                        "name": "Рени",
                        "areas": []
                    }, {"id": "3171", "parent_id": "2188", "name": "Саврань", "areas": []}, {
                        "id": "3172",
                        "parent_id": "2188",
                        "name": "Сарата",
                        "areas": []
                    }, {"id": "3173", "parent_id": "2188", "name": "Тарутино", "areas": []}, {
                        "id": "3174",
                        "parent_id": "2188",
                        "name": "Татарбунары",
                        "areas": []
                    }, {"id": "3650", "parent_id": "2188", "name": "Теплодар", "areas": []}, {
                        "id": "3175",
                        "parent_id": "2188",
                        "name": "Фрунзовка",
                        "areas": []
                    }, {"id": "3176", "parent_id": "2188", "name": "Ширяево", "areas": []}, {
                        "id": "3177",
                        "parent_id": "2188",
                        "name": "Южный (Одесская область)",
                        "areas": []
                    }, {"id": "6057", "parent_id": "2188", "name": "Подольск (Одесская область)", "areas": []}]
                }, {
                    "id": "2193",
                    "parent_id": "5",
                    "name": "Полтавская область",
                    "areas": [{
                        "id": "3217",
                        "parent_id": "2193",
                        "name": "Великая Багачка",
                        "areas": []
                    }, {"id": "3218", "parent_id": "2193", "name": "Гадяч", "areas": []}, {
                        "id": "3219",
                        "parent_id": "2193",
                        "name": "Глобино",
                        "areas": []
                    }, {"id": "3220", "parent_id": "2193", "name": "Гребенка", "areas": []}, {
                        "id": "3221",
                        "parent_id": "2193",
                        "name": "Диканька",
                        "areas": []
                    }, {"id": "3222", "parent_id": "2193", "name": "Зеньков", "areas": []}, {
                        "id": "3223",
                        "parent_id": "2193",
                        "name": "Карловка",
                        "areas": []
                    }, {"id": "3224", "parent_id": "2193", "name": "Кобеляки", "areas": []}, {
                        "id": "3225",
                        "parent_id": "2193",
                        "name": "Козельщина",
                        "areas": []
                    }, {
                        "id": "2194",
                        "parent_id": "2193",
                        "name": "Горишние Плавни (Комсомольск)",
                        "areas": []
                    }, {"id": "3226", "parent_id": "2193", "name": "Котельва", "areas": []}, {
                        "id": "2107",
                        "parent_id": "2193",
                        "name": "Кременчуг",
                        "areas": []
                    }, {"id": "3227", "parent_id": "2193", "name": "Лохвица", "areas": []}, {
                        "id": "2196",
                        "parent_id": "2193",
                        "name": "Лубны",
                        "areas": []
                    }, {"id": "3228", "parent_id": "2193", "name": "Машевка", "areas": []}, {
                        "id": "2485",
                        "parent_id": "2193",
                        "name": "Миргород",
                        "areas": []
                    }, {"id": "3229", "parent_id": "2193", "name": "Новые Санжары", "areas": []}, {
                        "id": "3230",
                        "parent_id": "2193",
                        "name": "Оржица",
                        "areas": []
                    }, {"id": "3231", "parent_id": "2193", "name": "Пирятин", "areas": []}, {
                        "id": "128",
                        "parent_id": "2193",
                        "name": "Полтава",
                        "areas": []
                    }, {"id": "3232", "parent_id": "2193", "name": "Решетиловка", "areas": []}, {
                        "id": "3233",
                        "parent_id": "2193",
                        "name": "Семеновка (Полтавская область)",
                        "areas": []
                    }, {"id": "3234", "parent_id": "2193", "name": "Хорол", "areas": []}, {
                        "id": "3654",
                        "parent_id": "2193",
                        "name": "Червонозаводское",
                        "areas": []
                    }, {"id": "3235", "parent_id": "2193", "name": "Чернухи", "areas": []}, {
                        "id": "3236",
                        "parent_id": "2193",
                        "name": "Чутово",
                        "areas": []
                    }, {"id": "3237", "parent_id": "2193", "name": "Шишаки", "areas": []}]
                }, {
                    "id": "2198",
                    "parent_id": "5",
                    "name": "Ровненская область",
                    "areas": [{"id": "3492", "parent_id": "2198", "name": "Березно", "areas": []}, {
                        "id": "3493",
                        "parent_id": "2198",
                        "name": "Владимирец",
                        "areas": []
                    }, {"id": "3494", "parent_id": "2198", "name": "Гоща", "areas": []}, {
                        "id": "3495",
                        "parent_id": "2198",
                        "name": "Демидовка",
                        "areas": []
                    }, {"id": "3496", "parent_id": "2198", "name": "Дубно", "areas": []}, {
                        "id": "3497",
                        "parent_id": "2198",
                        "name": "Дубровица",
                        "areas": []
                    }, {"id": "3498", "parent_id": "2198", "name": "Заречное", "areas": []}, {
                        "id": "3499",
                        "parent_id": "2198",
                        "name": "Здолбунов",
                        "areas": []
                    }, {"id": "3500", "parent_id": "2198", "name": "Корец", "areas": []}, {
                        "id": "3501",
                        "parent_id": "2198",
                        "name": "Костополь",
                        "areas": []
                    }, {"id": "2944", "parent_id": "2198", "name": "Кузнецовск", "areas": []}, {
                        "id": "3502",
                        "parent_id": "2198",
                        "name": "Млинов",
                        "areas": []
                    }, {"id": "3503", "parent_id": "2198", "name": "Острог", "areas": []}, {
                        "id": "3504",
                        "parent_id": "2198",
                        "name": "Радивилов",
                        "areas": []
                    }, {"id": "129", "parent_id": "2198", "name": "Ровно", "areas": []}, {
                        "id": "3505",
                        "parent_id": "2198",
                        "name": "Рокитное",
                        "areas": []
                    }, {"id": "3069", "parent_id": "2198", "name": "Сарны", "areas": []}]
                }, {
                    "id": "2200",
                    "parent_id": "5",
                    "name": "Сумская область",
                    "areas": [{"id": "2443", "parent_id": "2200", "name": "Ахтырка", "areas": []}, {
                        "id": "3464",
                        "parent_id": "2200",
                        "name": "Белополье",
                        "areas": []
                    }, {"id": "3465", "parent_id": "2200", "name": "Бурынь", "areas": []}, {
                        "id": "3466",
                        "parent_id": "2200",
                        "name": "Великая Писаревка",
                        "areas": []
                    }, {"id": "3639", "parent_id": "2200", "name": "Ворожба", "areas": []}, {
                        "id": "3467",
                        "parent_id": "2200",
                        "name": "Глухов",
                        "areas": []
                    }, {"id": "3642", "parent_id": "2200", "name": "Дружба", "areas": []}, {
                        "id": "2201",
                        "parent_id": "2200",
                        "name": "Конотоп",
                        "areas": []
                    }, {
                        "id": "3468",
                        "parent_id": "2200",
                        "name": "Краснополье (Сумская область)",
                        "areas": []
                    }, {"id": "3469", "parent_id": "2200", "name": "Кролевец", "areas": []}, {
                        "id": "3470",
                        "parent_id": "2200",
                        "name": "Лебедин",
                        "areas": []
                    }, {"id": "3471", "parent_id": "2200", "name": "Липовая Долина", "areas": []}, {
                        "id": "3472",
                        "parent_id": "2200",
                        "name": "Недригайлов",
                        "areas": []
                    }, {"id": "3473", "parent_id": "2200", "name": "Путивль", "areas": []}, {
                        "id": "2994",
                        "parent_id": "2200",
                        "name": "Ромны",
                        "areas": []
                    }, {"id": "3474", "parent_id": "2200", "name": "Середина-Буда", "areas": []}, {
                        "id": "132",
                        "parent_id": "2200",
                        "name": "Сумы",
                        "areas": []
                    }, {
                        "id": "3475",
                        "parent_id": "2200",
                        "name": "Тростянец (Сумская область)",
                        "areas": []
                    }, {"id": "2203", "parent_id": "2200", "name": "Шостка", "areas": []}, {
                        "id": "3476",
                        "parent_id": "2200",
                        "name": "Ямполь (Сумская область)",
                        "areas": []
                    }]
                }, {
                    "id": "2204",
                    "parent_id": "5",
                    "name": "Тернопольская область",
                    "areas": [{"id": "2722", "parent_id": "2204", "name": "Бережаны", "areas": []}, {
                        "id": "2723",
                        "parent_id": "2204",
                        "name": "Борщев",
                        "areas": []
                    }, {"id": "3477", "parent_id": "2204", "name": "Бучач", "areas": []}, {
                        "id": "3478",
                        "parent_id": "2204",
                        "name": "Гусятин",
                        "areas": []
                    }, {"id": "3479", "parent_id": "2204", "name": "Залещики", "areas": []}, {
                        "id": "3480",
                        "parent_id": "2204",
                        "name": "Збараж",
                        "areas": []
                    }, {"id": "3481", "parent_id": "2204", "name": "Зборов", "areas": []}, {
                        "id": "3482",
                        "parent_id": "2204",
                        "name": "Козова",
                        "areas": []
                    }, {"id": "3625", "parent_id": "2204", "name": "Копычинцы", "areas": []}, {
                        "id": "3483",
                        "parent_id": "2204",
                        "name": "Кременец",
                        "areas": []
                    }, {"id": "3484", "parent_id": "2204", "name": "Лановцы", "areas": []}, {
                        "id": "3485",
                        "parent_id": "2204",
                        "name": "Монастыриска",
                        "areas": []
                    }, {"id": "3486", "parent_id": "2204", "name": "Подволочиск", "areas": []}, {
                        "id": "3487",
                        "parent_id": "2204",
                        "name": "Подгайцы",
                        "areas": []
                    }, {"id": "3488", "parent_id": "2204", "name": "Почаев", "areas": []}, {
                        "id": "3648",
                        "parent_id": "2204",
                        "name": "Скалат",
                        "areas": []
                    }, {"id": "3489", "parent_id": "2204", "name": "Теребовля", "areas": []}, {
                        "id": "133",
                        "parent_id": "2204",
                        "name": "Тернополь",
                        "areas": []
                    }, {"id": "3490", "parent_id": "2204", "name": "Чортков", "areas": []}, {
                        "id": "3491",
                        "parent_id": "2204",
                        "name": "Шумск",
                        "areas": []
                    }]
                }, {
                    "id": "2206",
                    "parent_id": "5",
                    "name": "Харьковская область",
                    "areas": [{"id": "3108", "parent_id": "2206", "name": "Балаклея", "areas": []}, {
                        "id": "3620",
                        "parent_id": "2206",
                        "name": "Барвенково",
                        "areas": []
                    }, {"id": "3109", "parent_id": "2206", "name": "Близнюки", "areas": []}, {
                        "id": "3110",
                        "parent_id": "2206",
                        "name": "Богодухов",
                        "areas": []
                    }, {"id": "3624", "parent_id": "2206", "name": "Валки", "areas": []}, {
                        "id": "3111",
                        "parent_id": "2206",
                        "name": "Великий Бурлук",
                        "areas": []
                    }, {
                        "id": "3112",
                        "parent_id": "2206",
                        "name": "Волчанск (Харьковская область)",
                        "areas": []
                    }, {"id": "3113", "parent_id": "2206", "name": "Двуречная", "areas": []}, {
                        "id": "3114",
                        "parent_id": "2206",
                        "name": "Дергачи",
                        "areas": []
                    }, {"id": "3115", "parent_id": "2206", "name": "Зачепиловка", "areas": []}, {
                        "id": "3116",
                        "parent_id": "2206",
                        "name": "Змиев",
                        "areas": []
                    }, {
                        "id": "3117",
                        "parent_id": "2206",
                        "name": "Золочев (Харьковская область)",
                        "areas": []
                    }, {"id": "2207", "parent_id": "2206", "name": "Изюм", "areas": []}, {
                        "id": "3118",
                        "parent_id": "2206",
                        "name": "Кегичевка",
                        "areas": []
                    }, {"id": "3119", "parent_id": "2206", "name": "Коломак", "areas": []}, {
                        "id": "3120",
                        "parent_id": "2206",
                        "name": "Комсомольское",
                        "areas": []
                    }, {"id": "3140", "parent_id": "2206", "name": "Красноград", "areas": []}, {
                        "id": "3121",
                        "parent_id": "2206",
                        "name": "Краснокутск",
                        "areas": []
                    }, {"id": "3122", "parent_id": "2206", "name": "Купянск", "areas": []}, {
                        "id": "3123",
                        "parent_id": "2206",
                        "name": "Лозовая",
                        "areas": []
                    }, {"id": "3623", "parent_id": "2206", "name": "Люботин", "areas": []}, {
                        "id": "3124",
                        "parent_id": "2206",
                        "name": "Малая Даниловка",
                        "areas": []
                    }, {"id": "3125", "parent_id": "2206", "name": "Мерефа", "areas": []}, {
                        "id": "3126",
                        "parent_id": "2206",
                        "name": "Новая Водолага",
                        "areas": []
                    }, {
                        "id": "3127",
                        "parent_id": "2206",
                        "name": "Первомайский (Харьковская область)",
                        "areas": []
                    }, {"id": "3128", "parent_id": "2206", "name": "Печенеги", "areas": []}, {
                        "id": "3129",
                        "parent_id": "2206",
                        "name": "Сахновщина",
                        "areas": []
                    }, {"id": "135", "parent_id": "2206", "name": "Харьков", "areas": []}, {
                        "id": "3130",
                        "parent_id": "2206",
                        "name": "Чугуев",
                        "areas": []
                    }, {"id": "3131", "parent_id": "2206", "name": "Шевченково", "areas": []}]
                }, {
                    "id": "2209",
                    "parent_id": "5",
                    "name": "Херсонская область",
                    "areas": [{"id": "3506", "parent_id": "2209", "name": "Белозерка", "areas": []}, {
                        "id": "3507",
                        "parent_id": "2209",
                        "name": "Берислав",
                        "areas": []
                    }, {"id": "3508", "parent_id": "2209", "name": "Великая Александровка", "areas": []}, {
                        "id": "3509",
                        "parent_id": "2209",
                        "name": "Великая Лепетиха",
                        "areas": []
                    }, {"id": "3510", "parent_id": "2209", "name": "Великие Копани", "areas": []}, {
                        "id": "3511",
                        "parent_id": "2209",
                        "name": "Верхний Рогачик",
                        "areas": []
                    }, {"id": "3512", "parent_id": "2209", "name": "Высокополье", "areas": []}, {
                        "id": "3513",
                        "parent_id": "2209",
                        "name": "Геническ",
                        "areas": []
                    }, {"id": "3514", "parent_id": "2209", "name": "Голая Пристань", "areas": []}, {
                        "id": "3515",
                        "parent_id": "2209",
                        "name": "Горностаевка",
                        "areas": []
                    }, {
                        "id": "3516",
                        "parent_id": "2209",
                        "name": "Ивановка (Херсонская область)",
                        "areas": []
                    }, {"id": "3517", "parent_id": "2209", "name": "Каланчак", "areas": []}, {
                        "id": "3518",
                        "parent_id": "2209",
                        "name": "Каховка",
                        "areas": []
                    }, {"id": "3519", "parent_id": "2209", "name": "Нижние Серогозы", "areas": []}, {
                        "id": "2210",
                        "parent_id": "2209",
                        "name": "Новая Каховка",
                        "areas": []
                    }, {"id": "3520", "parent_id": "2209", "name": "Нововоронцовка", "areas": []}, {
                        "id": "3521",
                        "parent_id": "2209",
                        "name": "Новотроицкое",
                        "areas": []
                    }, {"id": "3522", "parent_id": "2209", "name": "Скадовск", "areas": []}, {
                        "id": "3649",
                        "parent_id": "2209",
                        "name": "Таврийск",
                        "areas": []
                    }, {"id": "136", "parent_id": "2209", "name": "Херсон", "areas": []}, {
                        "id": "3523",
                        "parent_id": "2209",
                        "name": "Цюрупинск",
                        "areas": []
                    }, {"id": "3524", "parent_id": "2209", "name": "Чаплинка", "areas": []}]
                }, {
                    "id": "2212",
                    "parent_id": "5",
                    "name": "Хмельницкая область",
                    "areas": [{"id": "3409", "parent_id": "2212", "name": "Белогорье", "areas": []}, {
                        "id": "3410",
                        "parent_id": "2212",
                        "name": "Виньковцы",
                        "areas": []
                    }, {"id": "3411", "parent_id": "2212", "name": "Волочиск", "areas": []}, {
                        "id": "3412",
                        "parent_id": "2212",
                        "name": "Городок (Хмельницкая область)",
                        "areas": []
                    }, {"id": "3413", "parent_id": "2212", "name": "Деражня", "areas": []}, {
                        "id": "3414",
                        "parent_id": "2212",
                        "name": "Дунаевцы",
                        "areas": []
                    }, {"id": "3415", "parent_id": "2212", "name": "Изяслав", "areas": []}, {
                        "id": "2213",
                        "parent_id": "2212",
                        "name": "Каменец-Подольский",
                        "areas": []
                    }, {"id": "3416", "parent_id": "2212", "name": "Красилов", "areas": []}, {
                        "id": "3417",
                        "parent_id": "2212",
                        "name": "Летичев",
                        "areas": []
                    }, {"id": "3418", "parent_id": "2212", "name": "Нетешин", "areas": []}, {
                        "id": "3419",
                        "parent_id": "2212",
                        "name": "Новая Ушица",
                        "areas": []
                    }, {"id": "3420", "parent_id": "2212", "name": "Полонное", "areas": []}, {
                        "id": "2712",
                        "parent_id": "2212",
                        "name": "Славута",
                        "areas": []
                    }, {"id": "3421", "parent_id": "2212", "name": "Старая Синява", "areas": []}, {
                        "id": "3422",
                        "parent_id": "2212",
                        "name": "Староконстантинов",
                        "areas": []
                    }, {"id": "3423", "parent_id": "2212", "name": "Теофиполь", "areas": []}, {
                        "id": "137",
                        "parent_id": "2212",
                        "name": "Хмельницкий",
                        "areas": []
                    }, {"id": "3424", "parent_id": "2212", "name": "Чемеровцы", "areas": []}, {
                        "id": "2215",
                        "parent_id": "2212",
                        "name": "Шепетовка",
                        "areas": []
                    }, {"id": "3425", "parent_id": "2212", "name": "Ярмолинцы", "areas": []}]
                }, {
                    "id": "2216",
                    "parent_id": "5",
                    "name": "Черкасская область",
                    "areas": [{"id": "3357", "parent_id": "2216", "name": "Ватутино", "areas": []}, {
                        "id": "3358",
                        "parent_id": "2216",
                        "name": "Городище (Черкасская область)",
                        "areas": []
                    }, {"id": "3359", "parent_id": "2216", "name": "Драбов", "areas": []}, {
                        "id": "2711",
                        "parent_id": "2216",
                        "name": "Жашков",
                        "areas": []
                    }, {"id": "3360", "parent_id": "2216", "name": "Звенигородка", "areas": []}, {
                        "id": "3361",
                        "parent_id": "2216",
                        "name": "Золотоноша",
                        "areas": []
                    }, {
                        "id": "3362",
                        "parent_id": "2216",
                        "name": "Каменка (Черкасская область)",
                        "areas": []
                    }, {"id": "3363", "parent_id": "2216", "name": "Канев", "areas": []}, {
                        "id": "3364",
                        "parent_id": "2216",
                        "name": "Катеринополь",
                        "areas": []
                    }, {"id": "3365", "parent_id": "2216", "name": "Корсунь-Шевченковский", "areas": []}, {
                        "id": "3366",
                        "parent_id": "2216",
                        "name": "Лысянка",
                        "areas": []
                    }, {"id": "3367", "parent_id": "2216", "name": "Маньковка", "areas": []}, {
                        "id": "3368",
                        "parent_id": "2216",
                        "name": "Монастырище",
                        "areas": []
                    }, {"id": "2217", "parent_id": "2216", "name": "Смела", "areas": []}, {
                        "id": "3369",
                        "parent_id": "2216",
                        "name": "Тальное",
                        "areas": []
                    }, {"id": "2218", "parent_id": "2216", "name": "Умань", "areas": []}, {
                        "id": "3370",
                        "parent_id": "2216",
                        "name": "Христиновка",
                        "areas": []
                    }, {"id": "138", "parent_id": "2216", "name": "Черкассы", "areas": []}, {
                        "id": "3371",
                        "parent_id": "2216",
                        "name": "Чернобай",
                        "areas": []
                    }, {"id": "3372", "parent_id": "2216", "name": "Чигирин", "areas": []}, {
                        "id": "3373",
                        "parent_id": "2216",
                        "name": "Шпола",
                        "areas": []
                    }]
                }, {
                    "id": "2220",
                    "parent_id": "5",
                    "name": "Черниговская область",
                    "areas": [{"id": "3573", "parent_id": "2220", "name": "Бахмач", "areas": []}, {
                        "id": "3574",
                        "parent_id": "2220",
                        "name": "Бобровица",
                        "areas": []
                    }, {"id": "3575", "parent_id": "2220", "name": "Борзна", "areas": []}, {
                        "id": "3576",
                        "parent_id": "2220",
                        "name": "Варва",
                        "areas": []
                    }, {"id": "3577", "parent_id": "2220", "name": "Городня", "areas": []}, {
                        "id": "3578",
                        "parent_id": "2220",
                        "name": "Ичня",
                        "areas": []
                    }, {"id": "3579", "parent_id": "2220", "name": "Козелец", "areas": []}, {
                        "id": "3580",
                        "parent_id": "2220",
                        "name": "Короп",
                        "areas": []
                    }, {"id": "3581", "parent_id": "2220", "name": "Корюковка", "areas": []}, {
                        "id": "3582",
                        "parent_id": "2220",
                        "name": "Куликовка",
                        "areas": []
                    }, {"id": "3583", "parent_id": "2220", "name": "Мена", "areas": []}, {
                        "id": "2221",
                        "parent_id": "2220",
                        "name": "Нежин",
                        "areas": []
                    }, {"id": "3584", "parent_id": "2220", "name": "Новгород-Северский", "areas": []}, {
                        "id": "3585",
                        "parent_id": "2220",
                        "name": "Носовка",
                        "areas": []
                    }, {"id": "2222", "parent_id": "2220", "name": "Прилуки", "areas": []}, {
                        "id": "3586",
                        "parent_id": "2220",
                        "name": "Репки",
                        "areas": []
                    }, {"id": "3647", "parent_id": "2220", "name": "Седнев", "areas": []}, {
                        "id": "3587",
                        "parent_id": "2220",
                        "name": "Семеновка (Черниговская область)",
                        "areas": []
                    }, {"id": "3588", "parent_id": "2220", "name": "Сосница", "areas": []}, {
                        "id": "3589",
                        "parent_id": "2220",
                        "name": "Сребное",
                        "areas": []
                    }, {"id": "3590", "parent_id": "2220", "name": "Талалаевка", "areas": []}, {
                        "id": "140",
                        "parent_id": "2220",
                        "name": "Чернигов",
                        "areas": []
                    }, {"id": "3591", "parent_id": "2220", "name": "Щорс", "areas": []}]
                }, {
                    "id": "2224",
                    "parent_id": "5",
                    "name": "Черновицкая область",
                    "areas": [{"id": "3631", "parent_id": "2224", "name": "Батурин", "areas": []}, {
                        "id": "3636",
                        "parent_id": "2224",
                        "name": "Вашковцы",
                        "areas": []
                    }, {"id": "3542", "parent_id": "2224", "name": "Вижница", "areas": []}, {
                        "id": "3543",
                        "parent_id": "2224",
                        "name": "Герца",
                        "areas": []
                    }, {"id": "3544", "parent_id": "2224", "name": "Глыбокая", "areas": []}, {
                        "id": "3545",
                        "parent_id": "2224",
                        "name": "Заставна",
                        "areas": []
                    }, {"id": "3546", "parent_id": "2224", "name": "Кельменцы", "areas": []}, {
                        "id": "3547",
                        "parent_id": "2224",
                        "name": "Кицмань",
                        "areas": []
                    }, {"id": "3548", "parent_id": "2224", "name": "Новоднестровск", "areas": []}, {
                        "id": "3549",
                        "parent_id": "2224",
                        "name": "Новоселица",
                        "areas": []
                    }, {"id": "3550", "parent_id": "2224", "name": "Путила", "areas": []}, {
                        "id": "3551",
                        "parent_id": "2224",
                        "name": "Сокиряны",
                        "areas": []
                    }, {"id": "3552", "parent_id": "2224", "name": "Сторожинец", "areas": []}, {
                        "id": "3553",
                        "parent_id": "2224",
                        "name": "Хотин",
                        "areas": []
                    }, {"id": "139", "parent_id": "2224", "name": "Черновцы", "areas": []}]
                }]
            }
        ;

        let gender = getRandomArbitrary(0, 1);
        let name = getRandomArbitrary(0, users.length - 1);
        let action = getRandomArbitrary(0, actions.length - 1);
        let region = getRandomArbitrary(0, cities.areas.length - 1);
        let city = getRandomArbitrary(0, cities.areas[region].areas.length - 1);

        $dataNMessage.html(
            `<strong>${users[gender][name]}</strong> ${loc('из')} ${cities.areas[region].areas.length === 0 ? `${lvovich.cityFrom(cities.areas[region].name)}` : `${lvovich.cityFrom(cities.areas[region].areas[city].name)}`} ${actions[gender][action]} на <strong>${getRandomArbitrary(1, 9) * 1250} ${countryCurrency ? countryCurrency : 'грн'}.</strong>`
        );

        $widgetPreview.addClass("active");

        setTimeout(function () {

            $widgetPreview.removeClass("active");

            setTimeout(function () {
                generateNotice()
            }, getRandomArbitrary(1, 9) * 1250);

        }, 3000);

    }

    /**
     * @param min
     * @param max
     * @returns {number}
     */
    function getRandomArbitrary(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Change color scheme.
     *
     * @param id
     */
    function changeColorScheme(id) {
        let schemeObj = {
            colorScheme_1: {
                id: "scheme_1",
                btnColor: "#F2994A",
                sliderColor: "#9CD153",
                headerGradient:
                    "linear-gradient(180deg, rgba(24, 67, 95, 0.8) 0%, rgba(42, 101, 138, 0.8) 96.52%)",
                bgColor: "#ECF2F9",
                bgFooter: "#587AA1",
                bgFooterBtm: "#1F506E",
                labelColor: "#517B9A",
                bgFooterImg: "/assets/img/src/footer_1/footer_bg_type_1.png",
                faqColor: "#4F7A9E",
                headerImg_1: "/assets/img/src/header_1/background.png",
                headerImg_2: "/assets/img/src/header_2/background.png",
                headerImg_3: "/assets/img/src/header_3/background.png",
                headerImg_4: "/assets/img/src/header_4/bg.png",
                headerImg_5: "/assets/img/src/header_5/bg.jpg",
                headerImg_6: "/assets/img/src/header_6/bg.png",
                headerImg_7: "/assets/img/src/header_7/bg.png",
                headerImg_8: "/assets/img/src/header_8/bg.jpg",
                headerImg_9: "/assets/img/src/header_9/bg.jpg",
                headerImg_10: "/assets/img/src/header_10/bg.png",
                headerImg_11: "/assets/img/src/header_11/bg.png",
                headerImg_12: "/assets/img/src/header_12/bg.png",
                headerImg_13: "/assets/img/src/header_13/bg.png",
                headerImg_14: "/assets/img/src/header_14/bg.png",
                headerImg_15: "/assets/img/src/header_15/bg.png"
            },
            colorScheme_2: {
                id: "scheme_2",
                btnColor: "#459171",
                sliderColor: "#99D19D",
                headerGradient:
                    "linear-gradient(179.5deg, rgba(35, 74, 93, 0.8) 1.17%, rgba(15, 43, 57, 0.8) 105.75%, rgba(17, 35, 65, 0.8) 105.76%)",
                bgColor: "#F2E9D5",
                bgFooter: "#2C4A5F",
                bgFooterBtm: "#10212A",
                labelColor: "#459171",
                bgFooterImg: "/assets/img/src/footer_1/footer_bg_type_2.svg",
                faqColor: "#99D19D",
                headerImg_1: "/assets/img/src/header_1/background.png",
                headerImg_2: "/assets/img/src/header_2/background.png",
                headerImg_3: "/assets/img/src/header_3/background.png",
                headerImg_4: "/assets/img/src/header_4/bg.png",
                headerImg_5: "/assets/img/src/header_5/bg.jpg",
                headerImg_6: "/assets/img/src/header_6/bg.png",
                headerImg_7: "/assets/img/src/header_7/bg.png",
                headerImg_8: "/assets/img/src/header_8/bg.jpg",
                headerImg_9: "/assets/img/src/header_9/bg.jpg",
                headerImg_10: "/assets/img/src/header_10/bg.png",
                headerImg_11: "/assets/img/src/header_11/bg.png",
                headerImg_12: "/assets/img/src/header_12/bg.png",
                headerImg_13: "/assets/img/src/header_13/bg.png",
                headerImg_14: "/assets/img/src/header_14/bg.png",
                headerImg_15: "/assets/img/src/header_15/bg.png"
            },
            colorScheme_3: {
                id: "scheme_3",
                btnColor: "#D5494C",
                sliderColor: "#72CAC4",
                headerGradient:
                    "linear-gradient(180deg, rgba(14, 56, 66, 0.8) 0%, rgba(39, 95, 107, 0.8) 96.52%)",
                bgHeaderTop: "rgba(34, 53, 85, 0.8)",
                bgHeaderBottom: "rgba(178, 217, 219, 0.8)",
                bgColor: "#F3FAEF",
                bgFooter: "#223555",
                bgFooterBtm: "#192944",
                labelColor: "#223555",
                bgFooterImg: "/assets/img/src/footer_1/footer_bg_type_3.png",
                faqColor: "#B2D9DB",
                headerImg_1: "/assets/img/src/header_1/background.png",
                headerImg_2: "/assets/img/src/header_2/background.png",
                headerImg_3: "/assets/img/src/header_3/background.png",
                headerImg_4: "/assets/img/src/header_4/bg.png",
                headerImg_5: "/assets/img/src/header_5/bg.jpg",
                headerImg_6: "/assets/img/src/header_6/bg.png",
                headerImg_7: "/assets/img/src/header_7/bg.png",
                headerImg_8: "/assets/img/src/header_8/bg.jpg",
                headerImg_9: "/assets/img/src/header_9/bg.jpg",
                headerImg_10: "/assets/img/src/header_10/bg.png",
                headerImg_11: "/assets/img/src/header_11/bg.png",
                headerImg_12: "/assets/img/src/header_12/bg.png",
                headerImg_13: "/assets/img/src/header_13/bg.png",
                headerImg_14: "/assets/img/src/header_14/bg.png",
                headerImg_15: "/assets/img/src/header_15/bg.png"
            },
            colorScheme_4: {
                id: "scheme_4",
                btnColor: "#EE7470",
                sliderColor: "#72CAC4",
                headerGradient:
                    "linear-gradient(179.5deg, rgba(35, 74, 93, 0.8) 1.17%, rgba(15, 43, 57, 0.8) 105.75%, rgba(17, 35, 65, 0.8) 105.76%)",
                bgColor: "#F3FAEF",
                bgFooter: "#2A525B",
                bgFooterBtm: "#1C3B42",
                labelColor: "#2A525B",
                bgFooterImg: "/assets/img/src/footer_1/footer_bg_type_4.png",
                faqColor: "#F1D44A",
                headerImg_1: "/assets/img/src/header_1/background.png",
                headerImg_2: "/assets/img/src/header_2/background.png",
                headerImg_3: "/assets/img/src/header_3/background.png",
                headerImg_4: "/assets/img/src/header_4/bg.png",
                headerImg_5: "/assets/img/src/header_5/bg.jpg",
                headerImg_6: "/assets/img/src/header_6/bg.png",
                headerImg_7: "/assets/img/src/header_7/bg.png",
                headerImg_8: "/assets/img/src/header_8/bg.jpg",
                headerImg_9: "/assets/img/src/header_9/bg.jpg",
                headerImg_10: "/assets/img/src/header_10/bg.png",
                headerImg_11: "/assets/img/src/header_11/bg.png",
                headerImg_12: "/assets/img/src/header_12/bg.png",
                headerImg_13: "/assets/img/src/header_13/bg.png",
                headerImg_14: "/assets/img/src/header_14/bg.png",
                headerImg_15: "/assets/img/src/header_15/bg.png"
            },
            colorScheme_5: {
                id: "scheme_5",
                btnColor: "#DF7356",
                sliderColor: "#9FBFD6",
                headerGradient:
                    "linear-gradient(180deg, rgba(43, 50, 64, 0.8) 0%, rgba(70, 79, 97, 0.8) 96.52%)",
                bgColor: "#ECF2F9",
                bgFooter: "#2B3240",
                bgFooterBtm: "#212733",
                labelColor: "#517B9A",
                bgFooterImg: "/assets/img/src/footer_1/footer_bg_type_5.png",
                faqColor: "#87BADE",
                headerImg_1: "/assets/img/src/header_1/background.png",
                headerImg_2: "/assets/img/src/header_2/background.png",
                headerImg_3: "/assets/img/src/header_3/background.png",
                headerImg_4: "/assets/img/src/header_4/bg.png",
                headerImg_5: "/assets/img/src/header_5/bg.jpg",
                headerImg_6: "/assets/img/src/header_6/bg.png",
                headerImg_7: "/assets/img/src/header_7/bg.png",
                headerImg_8: "/assets/img/src/header_8/bg.jpg",
                headerImg_9: "/assets/img/src/header_9/bg.jpg",
                headerImg_10: "/assets/img/src/header_10/bg.png",
                headerImg_11: "/assets/img/src/header_11/bg.png",
                headerImg_12: "/assets/img/src/header_12/bg.png",
                headerImg_13: "/assets/img/src/header_13/bg.png",
                headerImg_14: "/assets/img/src/header_14/bg.png",
                headerImg_15: "/assets/img/src/header_15/bg.png"
            },
            colorScheme_6: {
                id: "scheme_6",
                btnColor: "#8884ff",
                sliderColor: "#ed987a",
                headerGradient:
                    "linear-gradient(180deg, rgba(17,34,56, 0.8) 0%, rgba(124,128,155, 0.8) 96.52%)",
                bgColor: "#ffffff",
                bgFooter: "#112238",
                bgFooterBtm: "#051224",
                labelColor: "#517B9A",
                bgFooterImg: "/assets/img/src/footer_1/footer_bg_type_6.svg",
                faqColor: "#7c809b",
                headerImg_1: "/assets/img/src/header_1/background.png",
                headerImg_2: "/assets/img/src/header_2/background.png",
                headerImg_3: "/assets/img/src/header_3/background.png",
                headerImg_4: "/assets/img/src/header_4/bg.png",
                headerImg_5: "/assets/img/src/header_5/bg.jpg",
                headerImg_6: "/assets/img/src/header_6/bg.png",
                headerImg_7: "/assets/img/src/header_7/bg.png",
                headerImg_8: "/assets/img/src/header_8/bg.jpg",
                headerImg_9: "/assets/img/src/header_9/bg.jpg",
                headerImg_10: "/assets/img/src/header_10/bg.png",
                headerImg_11: "/assets/img/src/header_11/bg.png",
                headerImg_12: "/assets/img/src/header_12/bg.png",
                headerImg_13: "/assets/img/src/header_13/bg.png",
                headerImg_14: "/assets/img/src/header_14/bg.png",
                headerImg_15: "/assets/img/src/header_15/bg.png"
            },
            colorScheme_7: {
                id: "scheme_7",
                btnColor: "#DF7356",
                sliderColor: "#c73b72",
                headerGradient:
                    "linear-gradient(180deg, rgba(58,52,86, 0.8) 0%, rgb(8,126,139,0.8) 96.52%)",
                bgColor: "#f6f6f6",
                bgFooter: "#3a3456",
                bgFooterBtm: "#181624",
                labelColor: "#517B9A",
                bgFooterImg: "/assets/img/src/footer_1/footer_bg_type_7.svg",
                faqColor: "#087e8b",
                headerImg_1: "/assets/img/src/header_1/background.png",
                headerImg_2: "/assets/img/src/header_2/background.png",
                headerImg_3: "/assets/img/src/header_3/background.png",
                headerImg_4: "/assets/img/src/header_4/bg.png",
                headerImg_5: "/assets/img/src/header_5/bg.jpg",
                headerImg_6: "/assets/img/src/header_6/bg.png",
                headerImg_7: "/assets/img/src/header_7/bg.png",
                headerImg_8: "/assets/img/src/header_8/bg.jpg",
                headerImg_9: "/assets/img/src/header_9/bg.jpg",
                headerImg_10: "/assets/img/src/header_10/bg.png",
                headerImg_11: "/assets/img/src/header_11/bg.png",
                headerImg_12: "/assets/img/src/header_12/bg.png",
                headerImg_13: "/assets/img/src/header_13/bg.png",
                headerImg_14: "/assets/img/src/header_14/bg.png",
                headerImg_15: "/assets/img/src/header_15/bg.png"
            },
            colorScheme_8: {
                id: "scheme_8",
                btnColor: "#254441",
                sliderColor: "#3eb5f1",
                headerGradient:
                    "linear-gradient(180deg, rgba(224,137,0,0.8) 0%, rgba(67,170,139,0.8) 96.52%)",
                bgColor: "#fff5e5",
                bgFooter: "#e08900",
                bgFooterBtm: "#714600",
                labelColor: "#517B9A",
                bgFooterImg: "/assets/img/src/footer_1/footer_bg_type_8.svg",
                faqColor: "#43aa8b",
                headerImg_1: "/assets/img/src/header_1/background.png",
                headerImg_2: "/assets/img/src/header_2/background.png",
                headerImg_3: "/assets/img/src/header_3/background.png",
                headerImg_4: "/assets/img/src/header_4/bg.png",
                headerImg_5: "/assets/img/src/header_5/bg.jpg",
                headerImg_6: "/assets/img/src/header_6/bg.png",
                headerImg_7: "/assets/img/src/header_7/bg.png",
                headerImg_8: "/assets/img/src/header_8/bg.jpg",
                headerImg_9: "/assets/img/src/header_9/bg.jpg",
                headerImg_10: "/assets/img/src/header_10/bg.png",
                headerImg_11: "/assets/img/src/header_11/bg.png",
                headerImg_12: "/assets/img/src/header_12/bg.png",
                headerImg_13: "/assets/img/src/header_13/bg.png",
                headerImg_14: "/assets/img/src/header_14/bg.png",
                headerImg_15: "/assets/img/src/header_15/bg.png"
            },
            colorScheme_9: {
                id: "scheme_9",
                btnColor: "#03b5aa",
                sliderColor: "#bfee5d",
                headerGradient:
                    "linear-gradient(180deg, rgba(69,20,112,0.8) 0%, rgba(76,102,99, 0.8) 96.52%)",
                bgColor: "#f9f9f9",
                bgFooter: "#451470",
                bgFooterBtm: "#210A35",
                labelColor: "#517B9A",
                bgFooterImg: "/assets/img/src/footer_1/footer_bg_type_9.svg",
                faqColor: "#4c6663",
                headerImg_1: "/assets/img/src/header_1/background.png",
                headerImg_2: "/assets/img/src/header_2/background.png",
                headerImg_3: "/assets/img/src/header_3/background.png",
                headerImg_4: "/assets/img/src/header_4/bg.png",
                headerImg_5: "/assets/img/src/header_5/bg.jpg",
                headerImg_6: "/assets/img/src/header_6/bg.png",
                headerImg_7: "/assets/img/src/header_7/bg.png",
                headerImg_8: "/assets/img/src/header_8/bg.jpg",
                headerImg_9: "/assets/img/src/header_9/bg.jpg",
                headerImg_10: "/assets/img/src/header_10/bg.png",
                headerImg_11: "/assets/img/src/header_11/bg.png",
                headerImg_12: "/assets/img/src/header_12/bg.png",
                headerImg_13: "/assets/img/src/header_13/bg.png",
                headerImg_14: "/assets/img/src/header_14/bg.png",
                headerImg_15: "/assets/img/src/header_15/bg.png"
            },
            colorScheme_10: {
                id: "scheme_10",
                btnColor: "#475b5a",
                sliderColor: "#f08700",
                headerGradient:
                    "linear-gradient(180deg, rgba(81,176,156,0.8) 0%, rgba(13,2,33,0.8) 96.52%)",
                bgColor: "#fffcf7",
                bgFooter: "#51b09c",
                bgFooterBtm: "#265349",
                labelColor: "#517B9A",
                bgFooterImg: "/assets/img/src/footer_1/footer_bg_type_10.svg",
                faqColor: "#0d0221",
                headerImg_1: "/assets/img/src/header_1/background.png",
                headerImg_2: "/assets/img/src/header_2/background.png",
                headerImg_3: "/assets/img/src/header_3/background.png",
                headerImg_4: "/assets/img/src/header_4/bg.png",
                headerImg_5: "/assets/img/src/header_5/bg.jpg",
                headerImg_6: "/assets/img/src/header_6/bg.png",
                headerImg_7: "/assets/img/src/header_7/bg.png",
                headerImg_8: "/assets/img/src/header_8/bg.jpg",
                headerImg_9: "/assets/img/src/header_9/bg.jpg",
                headerImg_10: "/assets/img/src/header_10/bg.png",
                headerImg_11: "/assets/img/src/header_11/bg.png",
                headerImg_12: "/assets/img/src/header_12/bg.png",
                headerImg_13: "/assets/img/src/header_13/bg.png",
                headerImg_14: "/assets/img/src/header_14/bg.png",
                headerImg_15: "/assets/img/src/header_15/bg.png"
            }
        };

        $.each(schemeObj, function (index, value) {
            if (id === value.id) {
                let btnColor = value.btnColor;
                let sliderColor = value.sliderColor;
                let bgColor = value.bgColor;
                let headerGradient = value.headerGradient;
                let headerImg_1 = value.headerImg_1;
                let headerImg_2 = value.headerImg_2;
                let headerImg_3 = value.headerImg_3;
                let headerImg_4 = value.headerImg_4;
                let headerImg_5 = value.headerImg_5;
                let headerImg_6 = value.headerImg_6;
                let bgFooter = value.bgFooter;
                let bgFooterBtm = value.bgFooterBtm;
                let bgFooterImg = value.bgFooterImg;
                let labelColor = value.labelColor;
                let headerItem = $('.header-item');
                let offerItem = $('.offer-item');
                let footerItem = $('.footer-item');
                let faqItem = $('.faq-item');

                headerItem.find('.header_btn').css('background', btnColor);
                headerItem.find('#filter_first .noUi-connect').css('background', sliderColor);
                headerItem.css('background', `${headerGradient}, url(${value[`headerImg_${allVitrineData.header.style}`]}) center center / cover`);
                console.log(value);

                if (allVitrineData.header.style == "3") {
                    headerItem.find('.item_label').css('background', labelColor);
                }

                offerItem.css('background', bgColor);
                offerItem.find('.offers_btn').css('background', btnColor);

                if (allVitrineData.offer.style == "3" && allVitrineData.offer.type == "horizontal") {
                    offerItem.find('.item_label').css('background', labelColor)
                }

                if (allVitrineData.footer == "1") {
                    footerItem.css('background', `url(${bgFooterImg}) center top`);
                } else {
                    footerItem.css('background', bgFooter);
                }

                footerItem.css('background-size', 'cover');
                footerItem.find('.footer_bottom_bg').css('background', bgFooterBtm);
                footerItem.find('.get_money_footer').css('background', btnColor);
                footerItem.find('.circle_img').css('border-color', btnColor);


                faqItem
                    .removeClass("scheme_1 scheme_2 scheme_3 scheme_4 scheme_5")
                    .addClass(id);

                if (getObjectPathValueSave(allVitrineData, "offer.btn.custom") === "true") {

                    $(".offers_btn").css({
                        background: getObjectPathValueSave(allVitrineData, "offer.btn.color"),
                        fontSize: getObjectPathValueSave(allVitrineData, "offer.btn.size", 16) + "px",
                        borderRadius: getObjectPathValueSave(allVitrineData, "offer.btn.radius", 0) + "px",
                    }).html(getObjectPathValueSave(allVitrineData, "offer.btn.text", "Оформить заявку"))

                }

                if (getObjectPathValueSave(allVitrineData, "header.btn.custom") === "true") {

                    $(".header_btn").css({
                        background: getObjectPathValueSave(allVitrineData, "header.btn.color"),
                        fontSize: getObjectPathValueSave(allVitrineData, "header.btn.size", 16) + "px",
                        borderRadius: getObjectPathValueSave(allVitrineData, "header.btn.radius", 0) + "px",
                    }).html(getObjectPathValueSave(allVitrineData, "header.btn.text", "Оформить заявку"))

                }


            }
        })
    }

    /**
     * Chunk array.
     *
     * @param arr
     * @param size
     * @returns {*[]}
     */
    const chunk = (arr, size) =>
        Array.from({length: Math.ceil(arr.length / size)}, (v, i) =>
            arr.slice(i * size, i * size + size)
        );

    /**
     * @returns {Promise<unknown>}
     */
    function getCustomerData() {

        return new Promise(function (resolve, reject) {

            fetch("https://tds.pdl-profit.com/consumer", {credentials: 'include'})
                .then(function (res) {
                    return res.json();
                })
                .then(function (res) {

                    if (res.status == "success") {
                        resolve(res);
                    } else {
                        reject(res);
                    }

                });

        });

    }

    /**
     *
     * @param object
     * @param path
     * @param def
     */
    function getObjectPathValueSave(object, path, def = "") {

        let res = object;
        path = path.split(".");

        for (let p of path) {

            if (res.hasOwnProperty(p)) {

                res = res[p];

            } else {
                res = def;
                break;
            }

        }

        return res;

    }

    /**
     * Trnasform url query to object.
     *
     * @returns {{}}
     */
    function queryToObj(str) {

        let res = str.slice(str.indexOf("?") + 1).split("&");
        let query = {};

        res.forEach(el => {

            el = el.split("=");
            if (el[0]) {
                query[el[0]] = el.length > 1 ? el[1] : null;
            }


        });

        return query

    }

    /**
     * Transform object to url query
     *
     * @param query
     * @returns {string}
     */
    function objectToQuery(query) {

        let res = [];

        for (let slug in query) {

            if (query.hasOwnProperty(slug)) {

                res.push(`${slug}=${query[slug]}`);

            }

        }

        return "?" + (res.join("&"));

    }

    /**
     * Format date or unix timestamp.
     *
     * @param date
     * @param format
     * @param fixTimezone
     * @returns {string}
     */
    function dateFormat(date, format = "d-m-Y H:i:s", fixTimezone = true) {

        let dateObj = new Date(date);
        //dateObj = fixTimezone ? new Date(date + (3600000)) : dateObj;
        let m = dateObj.getMonth() + 1;
        let d = dateObj.getDate();
        let i = dateObj.getMinutes();
        let h = dateObj.getHours();
        let s = dateObj.getSeconds();
        let w = [loc("вск"), loc("пнд"), loc("втр"), loc("срд"), loc("чтв"), loc("птн"), loc("сбт"),][dateObj.getDay()];

        return format
            .replace(/m/g, m < 10 ? "0" + m : m)
            .replace(/d/g, d < 10 ? "0" + d : d)
            .replace(/Y/g, dateObj.getFullYear())
            .replace(/H/g, h < 10 ? "0" + h : h)
            .replace(/i/g, i < 10 ? "0" + i : i)
            .replace(/s/g, s < 10 ? "0" + s : s)
            .replace(/w/g, w)

    }
});