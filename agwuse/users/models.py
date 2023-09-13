from django.contrib.auth.models import AbstractUser
from django.db.models import CASCADE, CharField, DateField, EmailField, ForeignKey, IntegerField
from django.urls import reverse
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """
    Default custom user model for AGwuse.
    If adding fields that need to be filled at user signup,
    check forms.SignupForm and forms.SocialSignupForms accordingly.
    """

    GENDER_TYPES = [("M", "Male"), ("F", "Female")]
    MARITAL_CHOICES = [("M", "Married"), ("S", "Single")]
    OCCUPATION_CHOICES = [
        ("Civil Servant", "Civil Servant"),
        ("Business Owner", "Business Owner"),
        ("Trader", "Trader"),
        ("Student", "Student"),
        ("Unemployed", "Unemployed"),
    ]
    DEPARTMENT_CHOICES = [
        ("MEN", "MEN"),
        ("WOMEN", "WOMEN"),
        ("YOUTH", "YOUTH"),
        ("CHILDREN", "CHILDREN"),
        ("YOUNG SINGLE", "YOUNG SINGLE"),
        ("TEENAGERS", "TEENAGERS"),
    ]
    # First and last name do not cover name patterns around the globe
    middle_name = CharField(_("Middle name of User"), blank=True, max_length=50)
    first_name = CharField(_("First Name of User"), max_length=50)  # type: ignore
    last_name = CharField(_("Last name of User"), max_length=50)  # type: ignore
    dob = DateField(_("Date of Birth"))
    sex = CharField(_("Gender"), choices=GENDER_TYPES)
    username = CharField(_("Username"), max_length=50)
    marital_status = CharField(_("Marital Status"), choices=MARITAL_CHOICES)
    password = CharField(_("User Password"))
    email = EmailField(_("User Email"), unique=True)
    phone_number = CharField(_("User Phone Number"), max_length=20)
    occupation = CharField(_("User Occupation"), choices=OCCUPATION_CHOICES)
    card_no = IntegerField()
    department = ForeignKey("Departments", on_delete=CASCADE)
    unit = ForeignKey("Units", on_delete=CASCADE)
    # post =

    def get_absolute_url(self) -> str:
        """Get URL for user's detail view.

        Returns:
            str: URL for user detail.

        """
        return reverse("users:detail", kwargs={"username": self.username})
