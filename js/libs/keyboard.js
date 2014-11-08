/**
 * Created with JetBrains PhpStorm.
 * User: Максим
 * Date: 06.10.14
 * Time: 1:02
 * Requires: jquery, underscore
 */

function Keyboard(options) {
    var defaultSettings = {
        'actions': {},
        'handlerFunction': null,
        'checkEvents': {
            'keyup':    1,
            'keydown':  1
        },
        'hardKeys': {
            'F1':       112,
            'F2':       113,
            'F3':       114,
            'F4':       115,
            'F5':       116,
            'F6':       117,
            'F7':       118,
            'F8':       119,
            'F9':       120,
            'F10':      121,
            'F11':      122,
            'F12':      123,
            'ESCAPE':   27,
            'LEFT':     37,
            'TOP':      38,
            'RIGHT':    39,
            'BOTTOM':   40
        },
        'passAuto':     true,
        'storageKey':   'keyboardActions',
        'eventsTarget': null
    };

    /**
     * Сохранить в локальном хранилище настройки действий
     * @param actions
     */
    this.saveActions = function(actions) {
        localStorage[this['storageKey']] = JSON.stringify(this['actions']);
    };
    /**
     * Восстановить из репозитория настройки действий
     * @returns Object
     */
    this.restoreActions = function() {
        var result = {};
        if (localStorage[this['storageKey']]) {
            result = JSON.parse(localStorage[this['storageKey']]);
        };
        this['actions'] = result;
        return result;
    };
    /**
     * Получить код клавиши
     * @param key
     * @returns {Number}
     */
    this.getKeyCode = function(key) {
        var result;
        key = key.toUpperCase();
        if (key in this['hardKeys']) {
            result =  this['hardKeys'][key];
        } else {
            result = key.charCodeAt(0);
        };
        return result;
    };
    /**
     * Зарегистрировать действие
     * @param key
     * @param modifiers
     * @param beginHandler
     * @param endHandler
     * @param longExec
     */
    this.registerKey = function(key, modifiers, beginHandler, endHandler, longExec) {
        var keyCode = this.getKeyCode(key);
        this['actions'][keyCode] = {
            'keyCode':      keyCode,
            'modifiers':    modifiers,
            'beginHandler': beginHandler,
            'endHandler':   endHandler,
            'longExec':     longExec,
            'exec':         false,
            'beginTime':    0
        };
    };
    /**
     * Зарегистрировать действие на несколько клавиш одновременно
     * @param keys
     * @param modifiers
     * @param beginHandler
     * @param endHandler
     * @param longExec
     */
    this.registerKeys = function(keys, modifiers, beginHandler, endHandler, longExec) {
        for (var i = 0; i < keys.length; i++) {
            this.registerKey(keys[i], modifiers, beginHandler, endHandler, longExec);
        };
    };
    /**
     * Получить действие для указанного события
     * @param event
     * @returns {Object|Boolean}
     */
    this.findAction = function(event) {
        var actions = this['actions'];
        if (event['keyCode'] in this['actions']) {
            var actionItem = this['actions'][event['keyCode']];
            var eventType = event['type'];
            if (eventType == 'keydown' && actionItem['modifiers'] && _.size(actionItem['modifiers'])) {
                for (var modifierName in actionItem['modifiers']) {
                    if (modifierName in event && !event[modifierName]) {
                        return false;
                    };
                };
            };
            return actionItem;
        } else {
            return false;
        };
    };
    /**
     * Обработать событие и выполнить действие
     * @param event
     */
    this.processing = function(event) {
        var action = this.findAction(event);
        var eventType = event['type'];
        switch (eventType) {
            case 'keydown':
                if (!(this['passAuto'] && action['exec'])) {
                    action['beginTime'] = (new Date()).getTime();
                    if (action['longExec']) {
                        action['exec'] = true;
                    };
                    if (action['beginHandler']) {
                        action['beginHandler']();
                    };
                };
                break;
            case 'keyup':
                if (action['beginTime']) {
                    var endTime = (new Date()).getTime();
                    var execTime = endTime - action['beginTime'];
                    action['beginTime'] = 0;
                    action['exec'] = false;
                    if (action['endHandler']) {
                        action['endHandler'](execTime);
                    };
                };
                break;
        };
    };
    /**
     * Получить список действий, выполняемых в данный момент
     * @returns Object
     */
    this.getExecActions = function() {
        var result = {};
        var actions = this['actions'];
        for (var keyCode in actions) {
            if (actions[keyCode]['longExec'] && actions[keyCode]['exec']) {
                result[keyCode] = actions[keyCode];
            };
        };
        return result;
    };
    /**
     * Перехват событий
     */
    this.link = function() {
        var that = this;
        if (!this['handlerFunction']) {
            this['handlerFunction'] = function(event) {
                that.processing(event);
                event.preventDefault();
            };
        };
        var checkEvents = this['checkEvents'];
        for (var eventName in checkEvents) {
            this['eventsTarget'].removeEventListener(eventName, this['handlerFunction'], false);
            this['eventsTarget'].addEventListener(eventName, this['handlerFunction'], false);
        };
    };
    /**
     * Инициализация
     * @param options
     */
    this.init = function(options) {
        $.extend(true, this, _.clone(defaultSettings), options);
        if (!this['eventsTarget'] && window.document) {
            this['eventsTarget'] = window.document;
        };
        this.link();
    };
    /**
     * Инициализация
     */
    this.init(options);
};