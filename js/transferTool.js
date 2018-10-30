/**
 * Created by 陈熠 on 2017/6/21
 * Update by Li on 2018/8/19
 * email   :  228112142@qq.com
 * q群      ：     275846351
 * 穿梭框
 */
layui.define(['element', 'form',], function (exports) {
    var $ = layui.jquery,
        layer = layui.layer,
        form = layui.form

    var config = {
        elem: undefined,
        url: undefined,  //url
        codeName: undefined,
        enumName: undefined,
        name: "",  //form表单获取的结果值
        disabledValue: "",  //不可选,变量逗号隔开
        seletedValue: "",  //已选,变量逗号隔开
        cascade: false,  //级联
    }

    var countSelectedItems = 0; //逸轩数量
    var countAllItems = 0;//左侧所有选项
    var countCheckedItems = 0;//左侧选择数量


    var transferTool = {
        /* 入口函数 */
        init: function (data) {
            var that = this;
            config = data;
            if (config.elem == undefined || config.elem == "") {
                layui.hint().error('初始化失败:请配置ID.');
                return;
            }

            if (config.url == undefined || config.url == "") {
                layui.hint().error('初始化失败:请配置url.');
                return;
            }
            //如果是通过表码取值
            if (config.codeName != undefined && config.codeName != "") {
                that.initDataByCode();
            }
            //如果是从后台获取数据
            if (config.url != undefined && config.url != "") {
                that.initDataByUrl();
            }
            //如果是从枚举获取数据
            if (config.enumName != undefined && config.enumName != "") {
                that.initDataByEnum();
            }
        },

        /**通过url获取数据 by chenyi 2017/7/5*/
        initDataByUrl: function () {
            var that = this;
            $.ajax({
                url: config.url,
                type: 'get',
                dataType: "json",
                success: function (R) {
                    if (R.code == 0) {
                        that.renderData(R);
                    } else {
                        layer.alert(R.msg);
                    }
                }
            });
        },
        /**获取数据 by chenyi 2017/7/5*/
        initDataByCode: function (codeName) {
            /**localStorage是否已存在该数据*/
            var data = $t.getStorageItem(codeName);
            if (!data) {
                $.ajax({
                    url: '/getData/getCodeValues',//字典获取接口
                    data: {codeName: codeName},
                    type: 'post',
                    dataType: "json",
                    success: function (R) {
                        if (R.code == 0) {
                            that.renderData(R);
                            /**设置localStorage缓存*/
                            $t.setStorageItem(codeName, data);
                        } else {
                            data = {};
                            alert(R.msg);
                        }
                    }
                });

            }

            return data;
        },
        /**获取数据 by chenyi 2017/7/19*/
        initDataByEnum: function (enumName) {
            /**localStorage是否已存在该数据*/
            var data = $t.getStorageItem(enumName);
            if (!data) {
                $.ajax({
                    url: '/getData/getEnum',//使用枚举渲染  可联系作者q 228112142
                    type: 'post',
                    data: {enumName: enumName},
                    dataType: "json",
                    success: function (R) {
                        if (R.code == 0) {
                            that.renderData(R);
                            /**设置localStorage缓存*/
                            $t.setStorageItem(enumName, data);
                        } else {
                            data = {};
                            alert(R.msg);
                        }
                    }
                });
            }
            return data;
        },
        /**渲染数据 by chenyi 2017/6/21*/
        renderData: function (R) {
            var cyProps = config;

            //获取下拉控件的name
            var _name = config.name;

            if (_name == "") {
                _name = "default[]";
            }
            if (_name.indexOf("[") == -1) {
                _name += "[]";
            }

            //获取下拉控件的默认值
            var _value = config.seletedValue;
            var _values = _value.split(",");

            //获取复选框禁用的值
            var _disabled = config.disabledValue || "";
            var _disableds = _disabled.split(",");

            //是否开启级联(如果是数据源必须指定为url)
            var _cascade = config.cascade || false;
            //查询款/级联父级
            var _searchHtml = "";
            //如果开启级联
            if (_cascade === true)  //待完善
            {
                if (!config.url) {
                    layer.hint().error("级联模式下,请将数据源配置为url");
                } else {
                    _searchHtml = [
                        '<dd lay-value="" class="transfer-search-div">',
                        '<div  cyType="selectTool" cyProps="url:\'' + cyProps.url + '\'"></div>',
                        '</dd>'
                    ].join("");
                }
            }

            if (_cascade === false) {
                _searchHtml = [
                    '<dd lay-value="" class="transfer-search-div" style="height:26px!important">',
                    '<input type="checkbox" lay-filter="transferLeftCheckedAll" class="selectAllLeft" style="float:left;max-width:30px;" title="" lay-skin="primary">',
                    '<i class="layui-icon  drop-search-btn"></i>',
                    '<input class="layui-input search_condition" style="width:150px;float:right;" placeholder="关键字搜索">',
                    '<i class="layui-icon  clear-btn search-clear-btn">&#x1006;</i>',
                    '</dd>'
                ].join("");
            }

            var data = R.data;
            //选中列表
            var leftList = "";
            //未选中列表
            var rightList = "";
            var countLeft = 0, countRight = 0;
            if (data !== undefined) {


                for (var i = 0; i < data.length; i++) {
                    var red = '';
                    if (data[i].state == 0) {
                        red = 'signed-red';
                    }

                    //设置默认值(向右侧插入元素)
                    if (_values.indexOf(data[i].id) == -1) {
                        var _input = '<dd lay-value="' + data[i].id + '" lay-title="' + data[i].name + '" class="' + red + '"><input  type="checkbox" lay-filter="transferLeftChecked" title="' + data[i].name + '" lay-skin="primary"></dd>';
                        //设置禁用
                        if (_disableds.indexOf(data[i].id) != -1) {
                            _input = _input.replace("<input", "<input disabled ")
                        }
                        leftList += _input;
                        countLeft++;
                    }
                    //像左侧插入元素
                    else {
                        var _input = '<dd lay-value="' + data[i].id + '"  lay-title="' + data[i].name + '" class="' + red + '"><input type="hidden" name="' + _name + '" value="' + data[i].id + '"><input lay-filter="transferRightChecked"   type="checkbox"  title="' + data[i].name + '" lay-skin="primary"></dd>';
                        //设置禁用
                        if (_disableds.indexOf(data[i].id) != -1) {
                            _input = _input.replace("<input", "<input disabled ")
                        }
                        rightList += _input;
                        countRight++;
                    }
                    $(config.elem).append(_input);
                }
                countAllItems = countLeft;
                countSelectedItems = countRight;
            }
            /** 渲染结果**/
            var outHtml =
                $(config.elem).html([
                    '<div class="transfer-content" style="width: 850px;height: 400px;position: relative">',
                    '<div class="transfer-panel transfer-panel-left">',
                    '<dd lay-value="" class="transfer-title-div" style="height:26px!important">',
                    '<input type="checkbox" lay-filter="transferLeftCheckedAll" class="selectAllLeft" style="float:left;max-width:30px;" title="" lay-skin="primary">',
                    '<div class="transfer-count" id="count-left">0/0项></div>',
                    '<span class="count-tig">未拥有</span>',
                    '</dd>',
                    // _searchHtml,
                    '<div class="transfer-search-div">',
                    '<i class="layui-icon  drop-search-btn"></i>',
                    '<input class="layui-input search_condition_left" placeholder="请输入搜索内容">',
                    '<i class="layui-icon clear-btn search-clear-btn-left">&#x1006;</i>',
                    '</div>',

                    '<div class="transfer-div">',
                    leftList,
                    '</div>',
                    '</div>',
                    '<div class="transfer-btn transfer-to-right">',
                    '<button title="右移" lay-name="' + _name + '" class="layui-btn layui-btn-normal layui-btn-sm layui-btn-disabled"><i class="layui-icon">&#xe65b;</i></button>',
                    '</div>',
                    '<div class="transfer-btn  transfer-to-left">',
                    '<button title="左移" lay-name="' + _name + '"  class="layui-btn layui-btn-normal layui-btn-sm layui-btn-disabled"><i class="layui-icon">&#xe65a;</i></button>',
                    '</div>',
                    '<div class="transfer-panel transfer-panel-right">',

                    '<dd lay-value="" class="transfer-title-div" style="height:26px!important">',
                    '<input type="checkbox" lay-filter="transferRightCheckedAll" class="selectAllRight" style="float:left;max-width:30px;" title="" lay-skin="primary">',
                    '<div class="transfer-count" id="count-right">0项目></div>',
                    '<span class="count-tig">已拥有</span>',
                    '</dd>',
                    // _searchHtml,
                    '<div class="transfer-search-div">',
                    '<i class="layui-icon  drop-search-btn"></i>',
                    '<input class="layui-input search_condition_right" placeholder="请输入搜索内容">',
                    '<i class="layui-icon  clear-btn search-clear-btn-right">&#x1006;</i>',
                    '</div>',
                    '<div class="transfer-div">',
                    rightList,
                    '</div>',
                    '</div>',
                    '</div>'
                ].join(""));
            $(config.elem).append(outHtml);
            form.render();
            // 角色统计
            $("#count-left").text(countAllItems + "项");
            $("#count-right").html(countSelectedItems + "项目");
        }
    }

    //穿梭框选中监听
    //左侧选中
    form.on('checkbox(transferLeftChecked)', function (data) {
        var $this = $(data.othis);
        var _parent = $this.parents(".transfer-content");
        var inputs = $this.parents(".transfer-div").find("dd input[type='checkbox']");
        var checked = $this.parents(".transfer-div").find("dd input[type='checkbox']:checked");
        //去掉顶部全选
        var selectAllLeft = _parent.find(".selectAllLeft");
        if (selectAllLeft.length > 0)
            if (selectAllLeft[0].checked) {
                selectAllLeft[0].click();
                form.render();
            }
        for (var i = 0; i < inputs.length; i++) {
            if ($(inputs[i]).is(':checked')) {
                _parent.find(".transfer-to-right button").removeClass("layui-btn-disabled");
                break;
            }
            _parent.find(".transfer-to-right button").addClass("layui-btn-disabled");
        }
        countCheckedItems = checked.length;
        $("#count-left").text(countCheckedItems + "/" + countAllItems + "项");
        if (countCheckedItems == 0) {
            $("#count-left").text(countAllItems + "项");
        }
    });

    //右侧选中
    form.on('checkbox(transferRightChecked)', function (data) {
        var $this = $(data.othis);
        var _parent = $this.parents(".transfer-content");
        var inputs = $this.parents(".transfer-div").find("dd input[type='checkbox']");
        var checked = $this.parents(".transfer-div").find("dd input[type='checkbox']:checked");

        //去掉顶部全选
        var selectAllRight = _parent.find(".selectAllRight");
        if (selectAllRight.length > 0)
            if (selectAllRight[0].checked) {
                selectAllRight[0].click();
                form.render();
            }


        for (var i = 0; i < inputs.length; i++) {
            if ($(inputs[i]).is(':checked')) {
                _parent.find(".transfer-to-left button").removeClass("layui-btn-disabled");
                break;
            }
            _parent.find(".transfer-to-left button").addClass("layui-btn-disabled");
        }
        var countCheckedNums = checked.length;
        if (countCheckedNums == 0) {
            $("#count-right").text(+countSelectedItems + "项目");
        } else {
            $("#count-right").text(countCheckedNums + "/" + countSelectedItems + "项目");
        }
    });

    /**右侧全选    add by li 2018/8/19**/
    form.on('checkbox(transferRightCheckedAll)', function (data) {
        var $this = $(this);

        var _name = $this.attr("lay-name") || "";
        var $parent = $this.parents(".transfer-content");
        var inputs = $parent.find(".transfer-panel-right .transfer-div").find("dd input[type='checkbox']");
        var checked = $parent.find(".transfer-panel-right .transfer-div").find("dd input[type='checkbox']:checked");
        var flag = false;
        for (var i = 0; i < inputs.length; i++) {
            if (data.elem.checked)  //全选
            {
                flag = true;
                if (!$(inputs[i]).is(':checked')) {
                    $(inputs[i]).click();
                }
                $("#count-right").text(inputs.length + "/" + inputs.length + "项目");
            }
            else //反选
            {
                if ($(inputs[i]).is(':checked')) {
                    $(inputs[i]).click();
                }
                $("#count-right").text(inputs.length + "项目");
            }
        }
        form.render();

        if (flag) {
            $parent.find(".transfer-to-left button").removeClass("layui-btn-disabled");
        }
        else {
            $parent.find(".transfer-to-left button").addClass("layui-btn-disabled");
        }
    });

    /**左全选    add by li 2018/8/19**/
    form.on('checkbox(transferLeftCheckedAll)', function (data) {
        var $this = $(this);
        var _name = $this.attr("lay-name") || "";
        var $parent = $this.parents(".transfer-content");
        var inputs = $parent.find(".transfer-panel-left .transfer-div").find("dd input[type='checkbox']");
        var flag = false;
        for (var i = 0; i < inputs.length; i++) {
            if (data.elem.checked)  //全选
            {
                flag = true;
                if (!$(inputs[i]).is(':checked')) {
                    $(inputs[i]).click();
                }
                $("#count-left").text(inputs.length + "/" + inputs.length + "项");
            }
            else //反选
            {
                if ($(inputs[i]).is(':checked')) {
                    $(inputs[i]).click();
                }
                $("#count-left").text(inputs.length + "项");
            }
        }
        form.render();

        if (flag) {
            $parent.find(".transfer-to-right button").removeClass("layui-btn-disabled");
        }
        else {
            $parent.find(".transfer-to-right button").addClass("layui-btn-disabled");
        }
    });

    // 右移监听
    $(document).on("click", ".transfer-to-right button", function () {
        var $this = $(this);
        var _name = $this.attr("lay-name") || "";
        var $parent = $this.parents(".transfer-content");
        var inputs = $parent.find(".transfer-panel-left .transfer-div").find("dd input[type='checkbox']");
        var inputs_checked = $parent.find(".transfer-panel-left .transfer-div").find("dd input[type='checkbox']:checked");
        var right_inputs = $parent.find(".transfer-panel-right .transfer-div").find("dd input[type='checkbox']");
        var right_checked = $parent.find(".transfer-panel-right .transfer-div").find("dd input[type='checkbox']:checked");
        var leftNum = inputs.length;
        var rightNum = right_inputs.length;
        if (leftNum != countAllItems) {
            countSelectedItems = rightNum;
            countAllItems = leftNum;
            $("#count-left").text(countAllItems + "项");
            if (right_checked.length > 0) {
                $("#count-right").text(right_checked.length + '/' + countSelectedItems + "项目");
            } else {
                $("#count-right").text(countSelectedItems + "项目");
            }
        }
        //去掉顶部全选
        var selectAllLeft = $parent.find(".selectAllLeft");
        if (selectAllLeft.length > 0)
            if (selectAllLeft[0].checked)
                selectAllLeft[0].click();
        for (var i = 0; i < inputs.length; i++) {
            if ($(inputs[i]).is(':checked')) {
                //右侧添加
                var _value = $(inputs[i]).parents("dd").attr("lay-value");
                var _title = $(inputs[i]).parents("dd").attr("lay-title");
                var _red = $(inputs[i]).parents("dd").attr("class");
                var _input = ['<dd lay-value="' + _value + '" lay-title="' + _title + '" class="' + _red + '"><input type="hidden" name="' + _name + '" value="' + _value + '" >',
                    '<input lay-filter="transferRightChecked"  ',
                    ' type="checkbox"  title="' + _title + '" lay-skin="primary"></dd>'
                ].join("");
                _value && _title && $parent.find(".transfer-panel-right .transfer-div").append(_input);
                //左侧删除
                $(inputs[i]).parents("dd").remove();
            }
        }
        //重置按钮禁用
        $parent.find(".transfer-to-right button").addClass("layui-btn-disabled");
        form.render('checkbox');
    });

    //左移监听
    $(document).on("click", ".transfer-to-left", function () {
        var $this = $(this);
        var $parent = $this.parents(".transfer-content");
        var inputs = $parent.find(".transfer-panel-right .transfer-div").find("dd input[type='checkbox']");
        var inputs_checked = $parent.find(".transfer-panel-right .transfer-div").find("dd input[type='checkbox']:checked");
        var left_inputs = $parent.find(".transfer-panel-left .transfer-div").find("dd input[type='checkbox']");
        var left_checked = $parent.find(".transfer-panel-left .transfer-div").find("dd input[type='checkbox']:checked");
        var rightNum = inputs.length;
        var leftNum = left_inputs.length;

        countSelectedItems = rightNum;
        countAllItems = leftNum;
        if (left_checked.length > 0) {
            $("#count-left").text(left_checked.length + "/" + countAllItems + "项");
        }
        else {
            $("#count-left").text(countAllItems + "项");
        }
        $("#count-right").text(countSelectedItems + "项目");
        //去掉顶部全选
        var selectAllRight = $parent.find(".selectAllRight");
        if (selectAllRight.length > 0)
            if (selectAllRight[0].checked)
                selectAllRight[0].click();

        for (var i = 0; i < inputs.length; i++) {
            if ($(inputs[i]).is(':checked')) {
                //右侧添加
                var _value = $(inputs[i]).parents("dd").attr("lay-value");
                var _title = $(inputs[i]).parents("dd").attr("lay-title");
                var _red = $(inputs[i]).parents("dd").attr("class");
                var _input = ['<dd lay-value="' + _value + '" lay-title="' + _title + '" class="' + _red + '">',
                    '<input lay-filter="transferLeftChecked"  ',
                    ' type="checkbox"  title="' + _title + '" lay-skin="primary"></dd>'
                ].join("");
                _value && _title && $parent.find(".transfer-panel-left .transfer-div").append(_input);
                //右侧删除
                $(inputs[i]).parents("dd").remove();
            }
        }
        //重置按钮禁用
        $parent.find(".transfer-to-left button").addClass("layui-btn-disabled");
        form.render('checkbox');

    });

    /**左侧--搜索监听回车  **/
    $(document).on("keypress", " .transfer-search-div .search_condition_left", function (e) {
        e.stopPropagation();
        //是否为Enter键
        if (/^13$/.test(e.keyCode)) {
            searchData($(this));

        }
    });

    /**右侧--搜索监听回车  **/
    $(document).on("keypress", " .transfer-search-div .search_condition_right", function (e) {
        e.stopPropagation();
        //是否为Enter键
        if (/^13$/.test(e.keyCode)) {
            searchData($(this), 'right');

        }
    });


    /**左侧搜索监听输入和复制  add by li 2018/8/19**/
    $(document).on("keyup paste", " .transfer-search-div .search_condition_left", function (e) {
        e.stopPropagation();
        searchData($(this));
    });

    /**右侧搜索监听输入和复制  add by li 2018/8/19**/
    $(document).on("keyup paste", " .transfer-search-div .search_condition_right", function (e) {
        e.stopPropagation();
        searchData($(this), 'right');
    });

    /**左侧清空搜索条件**/
    $(document).on("click", ".transfer-search-div .search-clear-btn-left", function (event) {
        $(this).prev().val("");
        searchData($(this));
    });

    /**右侧清空搜索条件**/
    $(document).on("click", ".transfer-search-div .search-clear-btn-right", function (event) {
        $(this).prev().val("");
        searchData($(this), 'right');
    });


    /**获取搜索后的数据  **/
    function searchData($this, position = 'left') {
        var value = $($this).val();
        var $parent = $this.parents(".transfer-content");
        if (position == 'left') {
            var dds = $parent.find(".transfer-panel-left .transfer-div").find("dd");
        } else {
            var dds = $parent.find(".transfer-panel-right .transfer-div").find("dd");
        }
        //显示搜索结果菜单
        var k = value;
        var patt = new RegExp(k);
        for (var i = 0; i < dds.length; i++) {
            if (k == "") {
                $(dds[i]).show();
            }
            else if (patt.test($(dds[i]).attr("lay-title"))) {
                $(dds[i]).show();
            }
            else {
                $(dds[i]).hide();
            }


            if (PinyinMatch != undefined)  //拼音匹配,需要引入PinyinMatch.js
            {
                if (PinyinMatch.match($(dds[i]).attr("lay-title"), k))
                    $(dds[i]).show();
            }
        }

    }

    //输出test接口
    exports('transferTool', transferTool);
});
