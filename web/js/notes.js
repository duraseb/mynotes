$(function(){

    var MAX_LENGTH = 100;
    var Note = Backbone.Model.extend({
        defaults: function() {
            return {
                created_ts: 0
            };
        },
        validate: function(attrs, options) {
            if (attrs.note.length > MAX_LENGTH) {
                return "a note can't be longer than " + MAX_LENGTH + " characters";
            }
        }
    });

    var NoteList = Backbone.Collection.extend({
        model: Note,
        localStorage: new Backbone.LocalStorage('notes'),
        comparator: function(note) {
            return note.get('created_ts');
        }
    });

    var Notes = new NoteList;

    var NoteView = Backbone.View.extend({
        tagName: 'li',
        template: _.template($('#item-template').html()),
        events: {
            'click .del': 'delete'
        },
        initialize: function() {
            this.listenTo(this.model, 'destroy', this.remove);
        },
        delete: function() {
            this.model.destroy();
        },
        render: function() {
            var note = this.model.clone();
            if (note.get('created_ts') > 0) {
                var dt = new Date(note.get('created_ts'));
                note.set('created_ts', dt.toLocaleString());
            } else {
                note.set('created_ts', '');
            };
            this.$el.html(this.template(note.toJSON()));
            return this;
        }
    });

    var AppView = Backbone.View.extend({
        el: $('#note_app'),
        events: {
            'keypress #note':  'keypress',
            'keyup #note':  'keypress',
            'keydown #note':  'keypress'
        },
        initialize: function() {
            this.input = this.$('#note');
            this.error_message = this.$('#error_message');
            this.chars_left = this.$('#chars_left span');
            this.chars_left.text(MAX_LENGTH);
            this.listenTo(Notes, 'add', this.addOne);
            this.listenTo(Notes, 'reset', this.addAll);
            this.listenTo(Notes, 'all', this.render);
            Notes.fetch();
            this.input.focus();
        },
        addOne: function(note) {
            var view = new NoteView({model: note});
            this.$('#notes_list').prepend(view.render().el);
        },
        addAll: function() {
            Notes.each(this.addOne, this);
        },
        keypress: function(e) {
            if (!this.input.val()) return;
            var chars_left = MAX_LENGTH - this.input.val().length;
            this.chars_left.text(chars_left);
            var note = new Note({note: this.input.val(), created_ts: Date.now()});
            if (!note.isValid()) {
                if (!this.input.hasClass('note_error')) {
                    this.input.addClass('note_error');
                }
                this.error_message.text(note.validationError).fadeIn();
                return;
            } else if (this.input.hasClass('note_error')) {
                this.input.removeClass('note_error');
                this.error_message.text('').fadeOut()
            }
            if (e.keyCode != 13) return;
            Notes.create(note);
            this.input.val('');
            this.chars_left.text(MAX_LENGTH);
        }
    });

    var App = new AppView;
});
