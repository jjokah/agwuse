from django.contrib.auth.models import AbstractUser
from django.db.models import CharField
from django.db.models import ManyToManyField
from django.db.models import Model
from django.urls import reverse
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """
    Default custom user model for AG Wuse.
    If adding fields that need to be filled at user signup,
    check forms.SignupForm and forms.SocialSignupForms accordingly.
    """

    # First and last name do not cover name patterns around the globe
    name = CharField(_("Name of User"), blank=True, max_length=255)
    first_name = None  # type: ignore[assignment]
    last_name = None  # type: ignore[assignment]

    departments = ManyToManyField(
        "Department",
        verbose_name=_("Departments"),
        blank=True,
        related_name="users",
    )

    def get_absolute_url(self) -> str:
        """Get URL for user's detail view.

        Returns:
            str: URL for user detail.

        """
        return reverse("users:detail", kwargs={"username": self.username})


class Department(Model):
    """
    Represents a department within the church.
    """

    name = CharField(_("Department Name"), max_length=255, unique=True)

    def __str__(self):
        return self.name
